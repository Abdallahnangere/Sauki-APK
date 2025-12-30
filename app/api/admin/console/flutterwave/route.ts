import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { endpoint, method, payload, password } = body;

        // Security Check
        if (password !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!process.env.FLUTTERWAVE_SECRET_KEY) {
            return NextResponse.json({ error: 'FLUTTERWAVE_SECRET_KEY missing' }, { status: 500 });
        }

        // Clean endpoint
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const url = `https://api.flutterwave.com/v3${cleanEndpoint}`;

        console.log(`[FLW Console] ${method} ${url}`);

        const response = await axios({
            method: method || 'GET',
            url: url,
            data: method === 'GET' ? undefined : payload,
            headers: {
                'Authorization': `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
                'Content-Type': 'application/json'
            },
            validateStatus: () => true // Resolve promise even for 4xx/5xx to show error in console
        });

        return NextResponse.json({
            status: response.status,
            data: response.data
        });

    } catch (e: any) {
        return NextResponse.json(
            { error: e.message, details: e.response?.data }, 
            { status: 500 }
        );
    }
}