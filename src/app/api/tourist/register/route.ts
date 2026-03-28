import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Proxy to Render backend
    const backendUrl = process.env.BACKEND_URL || 'https://tourist-backend-acsb.onrender.com';
    const body = await req.json();

    const response = await fetch(`${backendUrl}/api/tourist/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Registration proxy failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
