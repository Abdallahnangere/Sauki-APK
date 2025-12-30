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

    console.log(`[Ecomm Init] Creating Virtual Account for ${name}`);

    // EXACT Payload requested by user
    const flwPayload = {
      email: "saukidatalinks@gmail.com",
      amount: amount.toString(),
      tx_ref: tx_ref,
      firstname: "Sauki",
      lastname: "Mart",
      narration: `Product Purchase: ${product.name}`,
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
            type: 'ecommerce',
            status: 'pending',
            phone,
            amount,
            productId,
            customerName: name,
            deliveryState: state,
            idempotencyKey: uuidv4(),
            paymentData: JSON.stringify(data),
          }
        });

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
    console.error('Payment Init Error:', error);
    return NextResponse.json({ error: 'Payment initiation failed' }, { status: 500 });
  }
}