import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import axios from 'axios';
import { callAmigoAPI, AMIGO_NETWORKS } from '../../../../lib/amigo';
import { Prisma } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const { tx_ref } = await req.json();
    
    // Initial Fetch
    let transaction = await prisma.transaction.findUnique({ where: { tx_ref } });
    if (!transaction) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

    // Fast exit if already done
    if (transaction.status === 'delivered') return NextResponse.json({ status: 'delivered' });
    
    let currentStatus = transaction.status;

    // 1. Verify with Flutterwave (if pending)
    if (currentStatus === 'pending') {
        try {
            const flwVerify = await axios.get(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${tx_ref}`, {
                headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` }
            });

            const flwData = flwVerify.data.data;

            if (flwVerify.data.status === 'success' && (flwData.status === 'successful' || flwData.status === 'completed')) {
                if (flwData.amount >= transaction.amount) {
                    transaction = await prisma.transaction.update({
                        where: { id: transaction.id },
                        data: { 
                            status: 'paid', 
                            paymentData: flwData
                        }
                    });
                    currentStatus = 'paid';
                }
            }
        } catch (error) {
            console.error('FLW Verify Error', error);
        }
    }

    // 2. AUTO-DELIVERY LOGIC (With ATOMIC LOCKING)
    if (currentStatus === 'paid' && transaction.type === 'data') {
        
        // Use updateMany to atomically check if deliveryData is NULL before setting it.
        // This acts as a lock. Only one request will succeed in updating 0 to 1 records.
        const lockResult = await prisma.transaction.updateMany({
            where: { 
                id: transaction.id,
                OR: [
                    { deliveryData: { equals: Prisma.DbNull } },
                    { deliveryData: { equals: Prisma.JsonNull } }
                ]
            },
            data: { 
                deliveryData: { status: 'processing', timestamp: Date.now() } 
            }
        });

        // If count is 0, it means deliveryData was NOT null (already processing or done)
        if (lockResult.count === 0) {
             const freshTx = await prisma.transaction.findUnique({ where: { id: transaction.id } });
             return NextResponse.json({ status: freshTx?.status || currentStatus });
        }

        // We have the lock. Proceed.
        const plan = await prisma.dataPlan.findUnique({ where: { id: transaction.planId! } });
        
        if (plan) {
            const networkId = AMIGO_NETWORKS[plan.network];
            
            const amigoPayload = {
                network: networkId, 
                mobile_number: transaction.phone,
                plan: Number(plan.planId),
                Ported_number: true
            };

            try {
                // Call Amigo
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
                            deliveryData: amigoRes.data
                        }
                    });
                    currentStatus = 'delivered';
                } else {
                    // Failed: Record error and keep lock to prevent auto-retry loop.
                    await prisma.transaction.update({
                        where: { id: transaction.id },
                        data: {
                            deliveryData: { ...amigoRes.data, error: 'Amigo API Failed', failedAt: Date.now() }
                        }
                    });
                    console.error("Amigo Failed:", amigoRes.data);
                }
            } catch (err: any) {
                // On crash, save error
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { deliveryData: { error: err.message, failedAt: Date.now() } }
                });
                throw err;
            }
        }
    }

    return NextResponse.json({ status: currentStatus });

  } catch (error) {
    console.error('Verification Error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}