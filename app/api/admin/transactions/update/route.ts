import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function POST(req: Request) {
    try {
        const { tx_ref, status, password } = await req.json();

        if (password !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const transaction = await prisma.transaction.update({
            where: { tx_ref },
            data: { 
                status: status as any,
                deliveryData: { 
                    method: 'Manual Admin Override',
                    updatedAt: new Date().toISOString()
                }
            }
        });

        return NextResponse.json({ success: true, transaction });
    } catch (error) {
        console.error('Admin status update error:', error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}