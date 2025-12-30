import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { planId, phone } = body;

    const plan = await prisma.dataPlan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    const tx_ref = `SAUKI-DATA-${uuidv4()}`;
    const amount = plan.price;

    const flwResponse = await axios.post(
      'https://api.flutterwave.com/v3/charges?type=bank_transfer',
      {
        tx_ref,
        amount,
        email: 'customer@saukimart.com',
        phone_number: phone,
        currency: 'NGN',
        meta: {
          plan_id: planId,
          type: 'data'
        }
      },
      {
        headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` }
      }
    );

    if (flwResponse.data.status !== 'success') {
      throw new Error('Flutterwave init failed');
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
        paymentData: flwResponse.data,
      }
    });

    return NextResponse.json({
      tx_ref,
      bank: paymentMeta.transfer_bank,
      account_number: paymentMeta.transfer_account,
      account_name: 'SAUKI MART',
      amount
    });

  } catch (error) {
    console.error('Data Payment Init Error:', error);
    return NextResponse.json({ error: 'Payment initiation failed' }, { status: 500 });
  }
}