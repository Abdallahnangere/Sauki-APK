import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import axios from 'axios';
import { callAmigoAPI, AMIGO_NETWORKS } from '../../../../lib/amigo';

export async function POST(req: Request) {
  try {
    const { tx_ref } = await req.json();
    
    const transaction = await prisma.transaction.findUnique({ where: { tx_ref } });
    if (!transaction) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

    // Optimization: If already delivered, skip everything
    if (transaction.status === 'delivered') return NextResponse.json({ status: 'delivered' });
    
    let currentStatus = transaction.status;

    // 1. Verify with Flutterwave if still pending
    if (currentStatus === 'pending') {
        try {
            const flwVerify = await axios.get(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${tx_ref}`, {
                headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` }
            });

            const flwData = flwVerify.data.data;

            if (flwVerify.data.status === 'success' && (flwData.status === 'successful' || flwData.status === 'completed')) {
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { status: 'paid', paymentData: JSON.stringify(flwData) }
                });
                currentStatus = 'paid';
            }
        } catch (error) {
            console.error('FLW Verify Error', error);
        }
    }

    // 2. AUTO-DELIVERY LOGIC (Retry)
    if (currentStatus === 'paid' && transaction.type === 'data') {
        
        const plan = await prisma.dataPlan.findUnique({ where: { id: transaction.planId! } });
        
        if (plan) {
            const networkId = AMIGO_NETWORKS[plan.network];
            
            // STRICT PAYLOAD REQUESTED BY USER
            const amigoPayload = {
                network: networkId,
                mobile_number: transaction.phone,
                plan: Number(plan.planId),
                Ported_number: true
            };

            const amigoRes = await callAmigoAPI('/data/', amigoPayload, tx_ref);

            const isSuccess = amigoRes.success && (
                amigoRes.data.success === true || 
                amigoRes.data.Status === 'successful' || 
                amigoRes.data.status === 'delivered' ||
                amigoRes.data.status === 'successful'
            );

            if (isSuccess) {
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        status: 'delivered',
                        deliveryData: JSON.stringify(amigoRes.data)
                    }
                });
                currentStatus = 'delivered';
            }
        }
    }

    return NextResponse.json({ status: currentStatus });

  } catch (error) {
    console.error('Verification Error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}