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

        // 1. Check for success status
        if (responseBody.status !== 'success') {
          console.error('[Flutterwave Error]', responseBody);
          throw new Error(responseBody.message || 'Payment initialization failed');
        }

        // 2. SMART EXTRACTION: Check for 'meta' at ROOT first, then inside 'data'
        const metaObj = responseBody.meta || responseBody.data?.meta;
        const bankInfo = metaObj?.authorization;

        // 3. Validate Bank Info
        if (!bankInfo || !bankInfo.transfer_bank || !bankInfo.transfer_account) {
            console.error('[Flutterwave Error] Missing bank details:', JSON.stringify(responseBody, null, 2));
            throw new Error('Payment gateway did not return bank account details. Please try again or contact support.');
        }

        // 4. Save to DB using the full responseBody
        await prisma.transaction.create({
          data: {
            tx_ref,
            type: 'data',
            status: 'pending',
            phone,
            amount,
            planId,
            idempotencyKey: uuidv4(),
            paymentData: responseBody, 
          }
        });

        // 5. Return success response
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