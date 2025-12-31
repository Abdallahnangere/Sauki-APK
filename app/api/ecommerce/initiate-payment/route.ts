import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, phone, name, state } = body;

    if (!process.env.FLUTTERWAVE_SECRET_KEY) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const tx_ref = `SAUKI-COMM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const amount = product.price;

    console.log(`[Ecomm Init] Charges Flow for ${name}`);

    const flwPayload = {
      tx_ref: tx_ref,
      amount: amount.toString(),
      email: "saukidatalinks@gmail.com",
      phone_number: phone,
      currency: "NGN",
      fullname: name,
      narration: `Product: ${product.name}`,
      meta: {
        consumer_state: state
      },
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

        // STRICT CHECK
        if (!data) {
             console.error('[Flutterwave Error] Response missing data object:', responseBody);
             throw new Error('Payment gateway returned empty data.');
        }

        const bankInfo = data.meta?.authorization;

        if (!bankInfo || !bankInfo.transfer_bank || !bankInfo.transfer_account) {
            console.error('[Flutterwave Error] Missing bank details in meta:', JSON.stringify(data, null, 2));
            throw new Error('Payment gateway did not return bank account details.');
        }

        await prisma.transaction.create({
          data: {
            tx_ref,
            type: 'ecommerce',
            status: 'pending',
            phone,
            amount,
            productId,
            customerName: name,
            deliveryState: state,
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
    console.error('Payment Init Error:', error);
    return NextResponse.json({ error: error.message || 'Payment initiation failed' }, { status: 500 });
  }
}