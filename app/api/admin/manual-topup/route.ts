import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { callAmigoAPI, AMIGO_NETWORKS } from '../../../../lib/amigo';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { phone, planId, password } = body;

        if (password !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const plan = await prisma.dataPlan.findUnique({ where: { id: planId } });
        if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

        // 1. Prepare Variables
        // Ensure the network key exists in your mapping (case-insensitive safe)
        const networkKey = plan.network.trim().toUpperCase();
        const networkId = AMIGO_NETWORKS[networkKey];
        
        if (!networkId) {
             return NextResponse.json({ error: `Invalid Network: ${plan.network}` }, { status: 400 });
        }

        // 2. DEFINE tx_ref HERE so it can be used everywhere
        const tx_ref = `MANUAL-${uuidv4()}`;
        
        const amigoPayload = {
            network: networkId,
            mobile_number: phone,
            plan: Number(plan.planId),
            Ported_number: true
        };

        console.log(`[Manual Topup] Sending to Amigo:`, JSON.stringify(amigoPayload));

        // 3. Call API (Pass tx_ref as idempotency key for tracking)
        const amigoRes = await callAmigoAPI(amigoPayload, tx_ref);

        const isSuccess = amigoRes.success && (
            amigoRes.data.success === true || 
            amigoRes.data.Status === 'successful' || 
            amigoRes.data.status === 'delivered' ||
            amigoRes.data.status === 'successful'
        );
        
        // 4. Save Transaction (Now tx_ref is defined)
        const transaction = await prisma.transaction.create({
            data: {
                tx_ref: tx_ref, // ✅ No longer undefined
                type: 'data',
                status: isSuccess ? 'delivered' : 'failed',
                phone,
                amount: 0, 
                planId: plan.id,
                deliveryData: amigoRes.data, // Stores the full API response
                paymentData: { method: 'Manual Admin Topup' }
            }
        });

        if (!isSuccess) {
            // Return 400 but include the transaction data so you know it failed
            return NextResponse.json({ 
                error: 'Tunnel Delivery Failed', 
                details: amigoRes.data,
                transactionId: transaction.id 
            }, { status: 400 });
        }

        return NextResponse.json({ success: true, transaction });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
    }
}
