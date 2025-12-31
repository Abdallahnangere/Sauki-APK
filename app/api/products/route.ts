
import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      where: { inStock: true }
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, price, image, category } = body;
    
    if (!name || !price) return NextResponse.json({ error: 'Name and Price are required' }, { status: 400 });

    const product = await prisma.product.create({
      data: {
        name,
        description: description || '',
        price: Number(price),
        image: image || 'https://placehold.co/600x600/png?text=Product',
        inStock: true,
        category: category || 'device'
      }
    });
    return NextResponse.json(product);
  } catch (error) {
    console.error("Create Product Error:", error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, ...data } = body;

        if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

        const product = await prisma.product.update({
            where: { id: String(id) },
            data: {
                name: data.name,
                description: data.description,
                price: Number(data.price),
                image: data.image,
                category: data.category
            }
        });
        return NextResponse.json(product);
    } catch (e) {
        console.error("Update Product Error:", e);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await prisma.product.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Delete Product Error:", e);
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
