import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, phone, name, state } = body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const tx_ref = `SAUKI-COMM-${uuidv4()}`;
    const amount = product.price;

    // Initiate Bank Transfer Charge via Flutterwave
    const flwResponse = await axios.post(
      'https://api.flutterwave.com/v3/charges?type=bank_transfer',
      {
        tx_ref,
        amount,
        email: 'customer@saukimart.com', // Placeholder
        phone_number: phone,
        currency: 'NGN',
        fullname: name,
        meta: {
          product_id: productId,
          state,
          type: 'ecommerce'
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
        type: 'ecommerce',
        status: 'pending',
        phone,
        amount,
        productId,
        customerName: name,
        deliveryState: state,
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
    console.error('Payment Init Error:', error);
    return NextResponse.json({ error: 'Payment initiation failed' }, { status: 500 });
  }
}