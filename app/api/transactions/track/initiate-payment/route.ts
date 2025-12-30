import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Endpoint moved to /api/ecommerce/initiate-payment' }, { status: 404 });
}