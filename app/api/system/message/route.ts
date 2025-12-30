import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const message = await prisma.systemMessage.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: 'desc' }
    });
    return NextResponse.json(message || null);
  } catch (error) {
    return NextResponse.json(null);
  }
}

export async function POST(req: Request) {
    try {
        const { content, type, isActive, password } = await req.json();
        
        if (password !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (isActive) {
            // Deactivate older active messages
            await prisma.systemMessage.updateMany({
                where: { isActive: true },
                data: { isActive: false }
            });
        }

        const message = await prisma.systemMessage.create({
            data: { content, type, isActive }
        });

        return NextResponse.json(message);
    } catch (e) {
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}