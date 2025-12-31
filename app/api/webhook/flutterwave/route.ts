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
                paymentData: payload
            }
        });
    }

    if (transaction.type === 'data' && transaction.planId) {
         const plan = await prisma.dataPlan.findUnique({ where: { id: transaction.planId } });
         
         if (plan) {
             // 1. NORMALIZE: Trim spaces and force uppercase
             const cleanNetwork = plan.network ? plan.network.trim().toUpperCase() : '';
             
             // 2. LOOKUP
             const networkId = AMIGO_NETWORKS[cleanNetwork];

             console.log(`[Webhook] Processing: ${transaction.phone} | Network: ${cleanNetwork} -> ID: ${networkId}`);

             // 3. SAFETY CHECK
             if (!networkId) {
                 console.error(`[Webhook] ❌ ABORTING: Invalid Network ID for '${cleanNetwork}'`);
                 return NextResponse.json({ error: 'Invalid Network Mapping' }, { status: 400 });
             }
             
             // 4. CONSTRUCT PAYLOAD
             const amigoPayload = {
                 network: networkId, 
                 mobile_number: transaction.phone,
                 plan: Number(plan.planId),
                 Ported_number: true
             };

             // 5. CALL API
             // Uses the harmonized 2-argument signature
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
