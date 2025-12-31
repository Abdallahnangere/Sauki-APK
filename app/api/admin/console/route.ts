import { NextResponse } from 'next/server';
import { callAmigoAPI } from '../../../../lib/amigo';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { endpoint, payload, password } = body;

        if (password !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Generate test key
        const idempotencyKey = `CONSOLE-${Date.now()}`;
        
        // Pass to Tunnel
        const result = await callAmigoAPI(endpoint, payload, idempotencyKey);

        // Return whatever the tunnel/amigo sent back
        return NextResponse.json(result.data, { status: result.status });

    } catch (e: any) {
        return NextResponse.json(
            { error: e.message }, 
            { status: 500 }
        );
    }
}