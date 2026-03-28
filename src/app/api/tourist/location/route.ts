import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Tourist from '@/lib/models/Tourist';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { blockchainId, lat, lng, safetyScore } = await req.json();

    if (!blockchainId) {
      return NextResponse.json({ error: 'blockchainId is required' }, { status: 400 });
    }

    const tourist = await Tourist.findOneAndUpdate(
      { blockchainId },
      { 
        currentLocation: { lat, lng },
        safetyScore: safetyScore !== undefined ? safetyScore : 100,
        lastPing: new Date()
      },
      { new: true }
    );

    if (!tourist) {
      return NextResponse.json({ error: 'Tourist not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      status: 'success', 
      data: tourist 
    });

  } catch (error: any) {
    console.error('Location update failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
