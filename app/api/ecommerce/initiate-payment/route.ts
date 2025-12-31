
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, phone, name, state, simId } = body; // Added simId (optional)

    if (!process.env.FLUTTERWAVE_SECRET_KEY) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    let totalAmount = product.price;
    let narration = `Product: ${product.name}`;
    let simProduct = null;

    // Logic for Cross-Selling (Adding SIM to Device)
    if (simId) {
        simProduct = await prisma.product.findUnique({ where: { id: simId } });
        if (simProduct) {
            totalAmount += simProduct.price;
            narration += ` + SIM: ${simProduct.name}`;
        }
    }

    const tx_ref = `SAUKI-COMM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    console.log(`[Ecomm Init] Charges Flow for ${name} - Total: ${totalAmount}`);

    const flwPayload = {
      tx_ref: tx_ref,
      amount: totalAmount.toString(),
      email: "saukidatalinks@gmail.com",
      phone_number: phone,
      currency: "NGN",
      fullname: name,
      narration: narration,
      meta: {
        consumer_state: state,
        included_sim_id: simId || null
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

        const metaObj = responseBody.meta || responseBody.data?.meta;
        const bankInfo = metaObj?.authorization;

        if (!bankInfo || !bankInfo.transfer_bank || !bankInfo.transfer_account) {
            throw new Error('Payment gateway did not return bank account details.');
        }

        await prisma.transaction.create({
          data: {
            tx_ref,
            type: 'ecommerce',
            status: 'pending',
            phone,
            amount: totalAmount,
            productId,
            customerName: name,
            deliveryState: state,
            idempotencyKey: uuidv4(),
            paymentData: responseBody,
          }
        });

        return NextResponse.json({
          tx_ref,
          bank: bankInfo.transfer_bank,
          account_number: bankInfo.transfer_account,
          account_name: 'SAUKI MART FLW', 
          amount: totalAmount,
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
