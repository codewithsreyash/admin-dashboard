import { NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/backend';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const data = await fetchBackendJson('/api/tourist/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Registration proxy failed:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
