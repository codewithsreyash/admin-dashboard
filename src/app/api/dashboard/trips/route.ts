import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Proxy to Render backend for live data
    const backendUrl = process.env.BACKEND_URL || 'https://tourist-backend-acsb.onrender.com';
    const response = await fetch(`${backendUrl}/api/dashboard/data`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const backendData = await response.json();

    // Transform backend data to match existing frontend format
    const trips: any[] = [];
    
    if (backendData.users && Array.isArray(backendData.users)) {
      // Group users by trip if available, otherwise create a default trip
      const groupedByTrip: Record<string, any[]> = {};
      
      backendData.users.forEach((user: any) => {
        const tripId = user.tripId || 'DEFAULT';
        if (!groupedByTrip[tripId]) {
          groupedByTrip[tripId] = [];
        }
        groupedByTrip[tripId].push(user);
      });

      // Convert grouped data to trips array
      Object.entries(groupedByTrip).forEach(([tripId, tourists]) => {
        trips.push({
          _id: tripId,
          tripId,
          title: tripId,
          touristIds: tourists.map((t: any) => t.id),
          tourists,
          alerts: backendData.alerts || [],
        });
      });
    }

    return NextResponse.json({ trips: trips.length > 0 ? trips : [] });
  } catch (error: any) {
    console.error('Failed to fetch dashboard trips from backend:', error);
    return NextResponse.json({ error: error.message, trips: [] }, { status: 500 });
  }
}
