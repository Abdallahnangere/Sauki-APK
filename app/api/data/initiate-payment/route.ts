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
      return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
    }

    const plan = await prisma.dataPlan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    const tx_ref = `SAUKI-DATA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const amount = plan.price;

    console.log(`[Data Init] Charges Flow for ${phone}`);

    const flwPayload = {
      tx_ref: tx_ref,
      amount: amount.toString(),
      email: "saukidatalinks@gmail.com",
      phone_number: phone,
      currency: "NGN",
      narration: `Data: ${plan.network} ${plan.data}`,
      is_permanent: false
    };

    try {
        const flwResponse = await axios.post(
          'https://api.flutterwave.com/v3/charges?type=bank_transfer',
          flwPayload,
          {
            headers: { 
                Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
          }
        );

        const responseBody = flwResponse.data;

        if (responseBody.status !== 'success') {
          console.error('[Flutterwave Error]', responseBody);
          throw new Error(responseBody.message || 'Payment initialization failed');
        }

        const data = responseBody.data;

        // STRICT CHECK: Ensure data and meta exist
        if (!data) {
             console.error('[Flutterwave Error] Response missing data object:', responseBody);
             throw new Error('Payment gateway returned empty data.');
        }

        const bankInfo = data.meta?.authorization;

        if (!bankInfo || !bankInfo.transfer_bank || !bankInfo.transfer_account) {
            console.error('[Flutterwave Error] Missing bank details in meta:', JSON.stringify(data, null, 2));
            throw new Error('Payment gateway did not return bank account details. Please try again or contact support.');
        }

        // Save to DB (Store paymentData as object, not string)
        await prisma.transaction.create({
          data: {
            tx_ref,
            type: 'data',
            status: 'pending',
            phone,
            amount,
            planId,
            idempotencyKey: uuidv4(),
            paymentData: data, 
          }
        });

        return NextResponse.json({
          tx_ref,
          bank: bankInfo.transfer_bank,
          account_number: bankInfo.transfer_account,
          account_name: 'SAUKI MART FLW', 
          amount,
          note: bankInfo.transfer_note
        });

    } catch (flwError: any) {
        const msg = flwError.response?.data?.message || flwError.message;
        console.error('[Flutterwave API Exception]', msg);
        return NextResponse.json({ 
            error: 'Payment Gateway Error', 
            details: msg 
        }, { status: 502 });
    }

  } catch (error: any) {
    console.error('Data Payment Init Error:', error);
    return NextResponse.json({ error: error.message || 'Payment initiation failed' }, { status: 500 });
  }
}