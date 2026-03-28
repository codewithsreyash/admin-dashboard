import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import Tourist from '@/lib/models/Tourist';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { name, tripId } = await req.json();

    if (!name || !tripId) {
      return NextResponse.json({ error: 'Name and Trip ID are required' }, { status: 400 });
    }

    // Generate a unique blockchainId
    const blockchainId = crypto
      .createHash('sha256')
      .update(`${name}-${tripId}-${Date.now()}`)
      .digest('hex')
      .substring(0, 16)
      .toUpperCase();

    const tourist = await Tourist.create({
      blockchainId,
      name,
      tripId,
      currentLocation: { lat: 28.6139, lng: 77.2090 }, // Default New Delhi
      safetyScore: 100
    });

    return NextResponse.json({ 
      status: 'success', 
      data: tourist 
    });

  } catch (error: any) {
    console.error('Registration failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
