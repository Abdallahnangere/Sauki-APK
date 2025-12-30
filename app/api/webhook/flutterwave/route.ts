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
    const { status, amount } = payload; 
    // FLW webhook payload often has tx_ref in 'txRef' or 'tx_ref' depending on version
    const reference = payload.txRef || payload.tx_ref || payload.reference; 

    console.log(`[Webhook] 🔔 Received event for ${reference}. Status: ${status}`);

    if (status !== 'successful' && status !== 'completed') {
        return NextResponse.json({ received: true });
    }

    // 2. Find Transaction
    const transaction = await prisma.transaction.findFirst({ 
        where: { tx_ref: reference } 
    });
    
    if (!transaction) {
        console.error(`[Webhook] ⚠️ Transaction not found: ${reference}`);
        return NextResponse.json({ error: 'Tx not found' }, { status: 404 });
    }

    // 3. Prevent Double Processing if already delivered
    if (transaction.status === 'delivered') {
        console.log(`[Webhook] ✅ Already delivered: ${reference}`);
        return NextResponse.json({ received: true });
    }

    // 4. Mark as Paid (if not already)
    if (transaction.status !== 'paid') {
        await prisma.transaction.update({
            where: { id: transaction.id },
            data: { 
                status: 'paid',
                paymentData: JSON.stringify(payload)
            }
        });
        console.log(`[Webhook] 💰 Marked as PAID: ${reference}`);
    }

    // 5. Trigger Instant Delivery (Amigo)
    if (transaction.type === 'data' && transaction.planId) {
         const plan = await prisma.dataPlan.findUnique({ where: { id: transaction.planId } });
         
         if (plan) {
             const networkId = AMIGO_NETWORKS[plan.network];
             
             // Construct payload exactly like the working console
             const amigoPayload = {
                 network: networkId,
                 mobile_number: transaction.phone,
                 plan: Number(plan.planId),
                 Ported_number: true
             };

             console.log(`[Webhook] 🚀 Triggering Amigo for ${reference}`, amigoPayload);
             const amigoRes = await callAmigoAPI('/data/', amigoPayload, reference);
             
             // Check strict success conditions
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
                 console.log(`[Webhook] ✨ DELIVERED ${reference}`);
             } else {
                 console.error(`[Webhook] ❌ Delivery Failed ${reference}`, amigoRes.data);
                 // We leave status as 'paid' so Admin can see it needs manual attention
             }
         } else {
             console.error(`[Webhook] Plan not found for ID: ${transaction.planId}`);
         }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
      console.error('[Webhook] 🔥 Error', error);
      return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}