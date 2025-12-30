import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { planId, phone } = body;

    if (!process.env.FLUTTERWAVE_SECRET_KEY) {
      console.error("FLUTTERWAVE_SECRET_KEY is missing");
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const plan = await prisma.dataPlan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    const tx_ref = `SAUKI-DATA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const amount = plan.price;
    const email = 'customer@saukimart.com';

    console.log(`[Payment Init] Starting for ${phone} - ${amount} NGN`);

    try {
        const flwResponse = await axios.post(
          'https://api.flutterwave.com/v3/charges?type=bank_transfer',
          {
            tx_ref,
            amount,
            email,
            phone_number: phone,
            currency: 'NGN',
            meta: {
              plan_id: planId,
              type: 'data',
              consumer_phone: phone
            }
          },
          {
            headers: { 
                Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
          }
        );

        if (flwResponse.data.status !== 'success') {
          console.error('[Flutterwave Error]', flwResponse.data);
          throw new Error('Flutterwave returned non-success status');
        }

        const paymentMeta = flwResponse.data.meta.authorization;

        await prisma.transaction.create({
          data: {
            tx_ref,
            type: 'data',
            status: 'pending',
            phone,
            amount,
            planId,
            idempotencyKey: uuidv4(),
            paymentData: JSON.stringify(flwResponse.data),
          }
        });

        return NextResponse.json({
          tx_ref,
          bank: paymentMeta.transfer_bank,
          account_number: paymentMeta.transfer_account,
          account_name: 'SAUKI MART',
          amount
        });

    } catch (flwError: any) {
        console.error('[Flutterwave API Exception]', flwError.response?.data || flwError.message);
        return NextResponse.json({ 
            error: 'Payment Gateway Error', 
            details: flwError.response?.data?.message || flwError.message 
        }, { status: 502 });
    }

  } catch (error) {
    console.error('Data Payment Init Error:', error);
    return NextResponse.json({ error: 'Payment initiation failed' }, { status: 500 });
  }
}