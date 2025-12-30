import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { planId, phone } = body;

    // 1. Basic Validation
    if (!planId || !phone) {
        return NextResponse.json({ error: 'Missing planId or phone number' }, { status: 400 });
    }

    if (!process.env.FLUTTERWAVE_SECRET_KEY) {
      console.error("FLUTTERWAVE_SECRET_KEY is missing");
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // 2. Fetch Plan Details
    const plan = await prisma.dataPlan.findUnique({ where: { id: planId } });
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    // 3. Prepare Payload
    const tx_ref = `SAUKI-DATA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const amount = plan.price;
    // Ideally use the real user's email if available, otherwise this placeholder is fine for Bank Transfers
    const email = 'customer@saukimart.com'; 

    console.log(`[Payment Init] Starting for ${phone} - ${amount} NGN`);

    try {
        // 4. Call Flutterwave API
        const flwResponse = await axios.post(
          'https://api.flutterwave.com/v3/charges?type=bank_transfer',
          {
            tx_ref,
            amount,
            email,
            phone_number: phone,
            currency: 'NGN',
            // is_permanent: false, // Optional: Ensures account expires after transaction
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

        // 5. Check Flutterwave Status
        if (flwResponse.data.status !== 'success') {
          console.error('[Flutterwave Error]', flwResponse.data);
          throw new Error('Flutterwave returned non-success status');
        }

        // --- CRITICAL FIX HERE ---
        // Flutterwave structure is { status: 'success', data: { meta: { authorization: ... } } }
        // axios response.data is the root object. So we need .data.data.meta
        const flwData = flwResponse.data.data;
        const paymentMeta = flwData.meta.authorization;

        // 6. Save Pending Transaction to Database
        await prisma.transaction.create({
          data: {
            tx_ref,
            type: 'data',
            status: 'pending',
            phone,
            amount,
            planId,
            idempotencyKey: uuidv4(),
            paymentData: JSON.stringify(flwResponse.data), // Save full log for debugging
          }
        });

        // 7. Return Transfer Details to Client
        return NextResponse.json({
          status: 'success',
          tx_ref,
          bank: paymentMeta.transfer_bank,
          account_number: paymentMeta.transfer_account,
          account_name: 'SAUKI MART', // Or paymentMeta.transfer_bank if provided
          amount: paymentMeta.transfer_amount || amount,
          expiry_note: paymentMeta.transfer_note || 'Expires soon'
        });

    } catch (flwError: any) {
        // Safe error logging
        console.error('[Flutterwave API Exception]', flwError.response?.data || flwError.message);
        return NextResponse.json({ 
            error: 'Payment Gateway Error', 
            details: flwError.response?.data?.message || 'Could not initiate bank transfer'
        }, { status: 502 });
    }

  } catch (error) {
    console.error('Data Payment Init Error:', error);
    return NextResponse.json({ error: 'Payment initiation failed' }, { status: 500 });
  }
}
