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

    if (transaction.status !== 'paid') {
        await prisma.transaction.update({
            where: { id: transaction.id },
            data: { 
                status: 'paid',
                paymentData: payload // Object, not string
            }
        });
    }

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

             const amigoRes = await callAmigoAPI('/data/', amigoPayload, reference);
             
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
                         deliveryData: amigoRes.data // Object, not string
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