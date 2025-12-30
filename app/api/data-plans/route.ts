import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const plans = await prisma.dataPlan.findMany({
      orderBy: { price: 'asc' }
    });
    return NextResponse.json(plans);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { network, data, validity, price, planId } = body;
    
    if (!network || !data || !price || !planId) {
         return NextResponse.json({ error: 'All fields required' }, { status: 400 });
    }

    const plan = await prisma.dataPlan.create({
      data: {
        network,
        data,
        validity: validity || '30 Days',
        price: Number(price),
        planId: Number(planId)
      }
    });
    return NextResponse.json(plan);
  } catch (error) {
    console.error("Create Plan Error:", error);
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, ...data } = body;

        if (!id) return NextResponse.json({ error: 'Plan ID required' }, { status: 400 });

        const plan = await prisma.dataPlan.update({
            where: { id: String(id) },
            data: {
                network: data.network,
                data: data.data,
                validity: data.validity,
                price: Number(data.price),
                planId: Number(data.planId)
            }
        });
        return NextResponse.json(plan);
    } catch (e) {
        console.error("Update Plan Error:", e);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await prisma.dataPlan.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Delete Plan Error:", e);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}