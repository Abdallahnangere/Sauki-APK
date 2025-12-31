import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { callAmigoAPI, AMIGO_NETWORKS } from '../../../../lib/amigo';

export async function POST(req: Request) {
  const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  const signature = req.headers.get('verif-hash');

  if (secret && signature !== secret) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const payload = body.data || body; 
    const { status } = payload; 
    const reference = payload.txRef || payload.tx_ref || payload.reference; 

    console.log(`[Webhook] 🔔 Received event for ${reference}. Status: ${status}`);

    if (status !== 'successful' && status !== 'completed') {
        return NextResponse.json({ received: true });
    }

    const transaction = await prisma.transaction.findFirst({ 
        where: { tx_ref: reference } 
    });
    
    if (!transaction) {
        return NextResponse.json({ error: 'Tx not found' }, { status: 404 });
    }

    if (transaction.status === 'delivered') {
        return NextResponse.json({ received: true });
    }

    // 1. Update status to PAID if not already
    if (transaction.status !== 'paid') {
        await prisma.transaction.update({
            where: { id: transaction.id },
            data: { 
                status: 'paid',
                paymentData: payload
            }
        });
    }

    // 2. Attempt Delivery
    if (transaction.type === 'data' && transaction.planId) {
         const plan = await prisma.dataPlan.findUnique({ where: { id: transaction.planId } });
         
         if (plan) {
             // CROSSCHECK: Ensure the network string from DB (e.g., 'MTN') exists in our mapping
             const networkId = AMIGO_NETWORKS[plan.network];

             if (!networkId) {
                 console.error(`[Webhook] ❌ Critical: No ID mapped for network ${plan.network}`);
                 // Optionally flag transaction as failed-delivery or requires-manual-review here
                 return NextResponse.json({ error: 'Invalid Network Mapping' }, { status: 400 });
             }
             
             // Construct Payload with correct Network ID (e.g., 1 for MTN)
             const amigoPayload = {
                 network: `1`,
                 mobile_number: transaction.phone,
                 plan: Number(plan.planId),
                 Ported_number: true
             };

             const amigoRes = await callAmigoAPI(amigoPayload, reference);
             
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
             }
         }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
      console.error('[Webhook] 🔥 Error', error);
      return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
