import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Trip from '@/lib/models/Trip';
import Tourist from '@/lib/models/Tourist';
import Alert from '@/lib/models/Alert';

export async function GET() {
  try {
    await dbConnect();

    // Fetch all trips
    const trips = await Trip.find({}).lean();

    // For each trip, fetch its tourists and active alerts
    const populatedTrips = await Promise.all(trips.map(async (trip: any) => {
      const tourists = await Tourist.find({
        blockchainId: { $in: trip.touristIds }
      }).lean();

      const alerts = await Alert.find({
        tripId: trip.tripId,
        status: 'Active'
      }).sort({ timestamp: -1 }).lean();

      return {
        ...trip,
        tourists,
        alerts
      };
    }));

    return NextResponse.json({ trips: populatedTrips });
  } catch (error: any) {
    console.error('Failed to fetch dashboard trips:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
