import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { planId, phone } = body;

    if (!process.env.FLUTTERWAVE_SECRET_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const plan = await prisma.dataPlan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    const tx_ref = `SAUKI-DATA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const amount = plan.price;

    console.log(`[Data Init] Creating Virtual Account for ${phone}`);

    // EXACT Payload requested by user
    const flwPayload = {
      email: "saukidatalinks@gmail.com",
      amount: amount.toString(),
      tx_ref: tx_ref,
      firstname: "Sauki",
      lastname: "Mart",
      narration: `Data Purchase ${plan.network} ${plan.data}`,
      phonenumber: phone,
      currency: "NGN",
      is_permanent: false
    };

    try {
        const flwResponse = await axios.post(
          'https://api.flutterwave.com/v3/virtual-account-numbers',
          flwPayload,
          {
            headers: { 
                Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
          }
        );

        if (flwResponse.data.status !== 'success') {
          console.error('[Flutterwave Error]', flwResponse.data);
          throw new Error('Flutterwave API returned error');
        }

        const data = flwResponse.data.data;

        await prisma.transaction.create({
          data: {
            tx_ref,
            type: 'data',
            status: 'pending',
            phone,
            amount,
            planId,
            idempotencyKey: uuidv4(),
            paymentData: JSON.stringify(data),
          }
        });

        // Map response for frontend
        return NextResponse.json({
          tx_ref,
          bank: data.bank_name,
          account_number: data.account_number,
          account_name: 'SAUKI MART FLW', // As requested
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