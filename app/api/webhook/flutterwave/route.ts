import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { callAmigoAPI, AMIGO_NETWORKS } from '../../../../lib/amigo';

export async function POST(req: Request) {
  // 1. Verify Signature (Security)
  const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  const signature = req.headers.get('verif-hash');

  if (!signature || (secret && signature !== secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const payload = body.data || body; 
    const { txRef, status, amount } = payload; 
    const reference = txRef || payload.tx_ref; // Flutterwave sometimes sends one or the other

    console.log(`[Webhook] Received for ${reference} status: ${status}`);

    if (status !== 'successful') {
        return NextResponse.json({ received: true });
    }

    // 2. Find Transaction
    const transaction = await prisma.transaction.findUnique({ where: { tx_ref: reference } });
    
    if (!transaction) {
        console.error(`[Webhook] Transaction not found: ${reference}`);
        return NextResponse.json({ error: 'Tx not found' }, { status: 404 });
    }

    // 3. Process Payment & Delivery
    if (transaction.status === 'pending') {
        
        // Mark as PAID locally first
        await prisma.transaction.update({
            where: { id: transaction.id },
            data: { 
                status: 'paid',
                paymentData: JSON.stringify(payload)
            }
        });
        
        // 4. If Data Bundle, Trigger Tunnel Delivery
        if (transaction.type === 'data' && transaction.planId) {
             const plan = await prisma.dataPlan.findUnique({ where: { id: transaction.planId } });
             
             if (plan) {
                 const networkId = AMIGO_NETWORKS[plan.network];
                 
                 const amigoPayload = {
                     network: networkId,
                     mobile_number: transaction.phone,
                     plan: Number(plan.planId),
                     Ported_number: true
                 };

                 console.log(`[Webhook] Triggering Amigo for ${reference}`);
                 const amigoRes = await callAmigoAPI('/data/', amigoPayload, reference);
                 
                 // Amigo Success Check
                 const isSuccess = amigoRes.success && (
                    amigoRes.data.success === true || 
                    amigoRes.data.Status === 'successful' ||
                    amigoRes.data.status === 'delivered'
                 );

                 if (isSuccess) {
                     await prisma.transaction.update({
                         where: { id: transaction.id },
                         data: { 
                             status: 'delivered', 
                             deliveryData: JSON.stringify(amigoRes.data) 
                         }
                     });
                     console.log(`[Webhook] Delivered ${reference}`);
                 } else {
                     console.error(`[Webhook] Delivery Failed ${reference}`, amigoRes.data);
                     // Status remains 'paid' so admin knows to retry
                 }
             }
        }
    }
  } catch (error) {
      console.error('[Webhook] Error', error);
      return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}