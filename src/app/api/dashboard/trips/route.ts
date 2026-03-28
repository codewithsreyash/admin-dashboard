import { NextResponse } from 'next/server';
import { fetchBackendJson } from '@/lib/backend';
import type { DashboardAlert, DashboardTourist, DashboardTripsResponse, DashboardTrip } from '@/lib/dashboard-types';

type RawBackendUser = {
  id?: string;
  blockchainId?: string;
  name?: string;
  tripId?: string;
  status?: string;
  score?: number;
  safetyScore?: number;
  lat?: number | null;
  lng?: number | null;
  lastPing?: string;
};

type RawBackendAlert = {
  _id?: string;
  alertId?: string;
  userId?: string;
  touristId?: string;
  tripId?: string;
  type?: string;
  lat?: number | null;
  lng?: number | null;
  location?: {
    lat?: number | null;
    lng?: number | null;
  } | null;
  status?: string;
  timestamp?: string;
};

export const dynamic = 'force-dynamic';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

function isDashboardTourist(value: DashboardTourist | null): value is DashboardTourist {
  return value !== null;
}

export async function GET() {
  try {
    const backendData = await fetchBackendJson<{
      users?: RawBackendUser[];
      alerts?: RawBackendAlert[];
    }>('/api/dashboard/data', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const trips: DashboardTrip[] = [];

    const safeUsers = Array.isArray(backendData?.users) ? backendData.users : [];
    const normalizedUsers: DashboardTourist[] = safeUsers
      .map((user) => {
        if (!isFiniteNumber(user?.lat) || !isFiniteNumber(user?.lng)) {
          return null;
        }

        const touristId = typeof user?.id === 'string'
          ? user.id
          : typeof user?.blockchainId === 'string'
            ? user.blockchainId
            : null;

        if (!touristId) {
          return null;
        }

        return {
          blockchainId: touristId,
          id: touristId,
          name: typeof user?.name === 'string' && user.name.trim() ? user.name : 'Unknown Tourist',
          tripId: typeof user?.tripId === 'string' && user.tripId.trim() ? user.tripId : 'DEFAULT',
          currentLocation: {
            lat: user.lat,
            lng: user.lng,
          },
          safetyScore: isFiniteNumber(user?.score)
            ? user.score
            : isFiniteNumber(user?.safetyScore)
              ? user.safetyScore
              : 100,
          status: typeof user?.status === 'string' && user.status.trim() ? user.status : 'Active',
          lastPing: typeof user?.lastPing === 'string' ? user.lastPing : new Date().toISOString(),
        };
      })
      .filter(isDashboardTourist);

    const tripIdByTouristId = normalizedUsers.reduce<Record<string, string>>((acc, user) => {
      acc[user.blockchainId] = user.tripId;
      return acc;
    }, {});

    const safeAlerts = Array.isArray(backendData?.alerts) ? backendData.alerts : [];
    const normalizedAlerts: DashboardAlert[] = safeAlerts.map((alert, index) => {
      const touristId = typeof alert?.touristId === 'string'
        ? alert.touristId
        : typeof alert?.userId === 'string'
          ? alert.userId
          : 'UNKNOWN';
      const tripId = typeof alert?.tripId === 'string' && alert.tripId.trim()
        ? alert.tripId
        : tripIdByTouristId[touristId] || 'DEFAULT';
      const lat = isFiniteNumber(alert?.location?.lat)
        ? alert.location.lat
        : isFiniteNumber(alert?.lat)
          ? alert.lat
          : null;
      const lng = isFiniteNumber(alert?.location?.lng)
        ? alert.location.lng
        : isFiniteNumber(alert?.lng)
          ? alert.lng
          : null;

      return {
        alertId: typeof alert?.alertId === 'string'
          ? alert.alertId
          : typeof alert?._id === 'string'
            ? alert._id
            : `alert-${touristId}-${index}`,
        touristId,
        tripId,
        type: typeof alert?.type === 'string' && alert.type.trim() ? alert.type : 'Unknown',
        status: typeof alert?.status === 'string' && alert.status.trim() ? alert.status : 'Active',
        timestamp: typeof alert?.timestamp === 'string' ? alert.timestamp : new Date().toISOString(),
        location: lat !== null && lng !== null ? { lat, lng } : null,
      };
    });

    const groupedByTrip: Record<string, DashboardTourist[]> = {};

    normalizedUsers.forEach((user) => {
      const tripId = typeof user?.tripId === 'string' && user.tripId.trim() ? user.tripId : 'DEFAULT';
      if (!groupedByTrip[tripId]) {
        groupedByTrip[tripId] = [];
      }
      groupedByTrip[tripId].push(user);
    });

    const allTripIds = new Set<string>([
      ...Object.keys(groupedByTrip),
      ...normalizedAlerts.map((alert) => alert.tripId),
    ]);

    allTripIds.forEach((tripId) => {
      const tourists = groupedByTrip[tripId] || [];
      trips.push({
        _id: tripId,
        tripId,
        title: tripId,
        touristIds: tourists.map((tourist) => tourist.id),
        tourists,
        alerts: normalizedAlerts.filter((alert) => alert.tripId === tripId),
      });
    });

    return NextResponse.json<DashboardTripsResponse>({ trips: trips.length > 0 ? trips : [] });
  } catch (error: unknown) {
    console.error('Failed to fetch dashboard trips from backend:', error);
    return NextResponse.json<DashboardTripsResponse>({ error: getErrorMessage(error), trips: [] }, { status: 502 });
  }
}
