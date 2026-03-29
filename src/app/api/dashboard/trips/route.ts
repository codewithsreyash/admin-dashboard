import { NextResponse } from "next/server"
import { fetchBackendJson } from "@/lib/backend"
import type { DashboardAlert, DashboardTourist, DashboardTrip, DashboardTripsResponse } from "@/lib/dashboard-types"

type RawLocation = {
  lat?: number | null
  lng?: number | null
} | null

type RawBackendTourist = {
  _id?: string
  id?: string
  blockchainId?: string
  passportHash?: string
  name?: string
  tripId?: string
  safetyScore?: number
  status?: string
  lastPing?: string
  lat?: number | null
  lng?: number | null
  currentLocation?: RawLocation
}

type RawBackendAlert = {
  _id?: string
  alertId?: string
  touristId?: string
  userId?: string
  tripId?: string
  type?: string
  status?: string
  timestamp?: string
  lat?: number | null
  lng?: number | null
  location?: RawLocation
}

type RawBackendTrip = {
  _id?: string
  tripId?: string
  title?: string
  name?: string
  destination?: string
  startDate?: string
  endDate?: string
  status?: string
  touristIds?: string[]
  touristCount?: number
  tourists?: RawBackendTourist[]
  alerts?: RawBackendAlert[]
}

type BackendTripsEnvelope = {
  status?: string
  data?: {
    trips?: RawBackendTrip[]
  }
}

export const dynamic = "force-dynamic"

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error"
}

function normalizeLocation(value: RawLocation, fallbackLat?: number | null, fallbackLng?: number | null) {
  const lat = isFiniteNumber(value?.lat) ? value.lat : isFiniteNumber(fallbackLat) ? fallbackLat : null
  const lng = isFiniteNumber(value?.lng) ? value.lng : isFiniteNumber(fallbackLng) ? fallbackLng : null

  return lat !== null && lng !== null ? { lat, lng } : null
}

function normalizeTourist(value: RawBackendTourist, index: number): DashboardTourist | null {
  const touristId =
    (typeof value?.blockchainId === "string" && value.blockchainId.trim()) ||
    (typeof value?.id === "string" && value.id.trim()) ||
    (typeof value?.passportHash === "string" && value.passportHash.trim()) ||
    null

  if (!touristId) {
    return null
  }

  return {
    _id: typeof value?._id === "string" ? value._id : undefined,
    blockchainId: touristId,
    id: touristId,
    passportHash: typeof value?.passportHash === "string" ? value.passportHash : undefined,
    name: typeof value?.name === "string" && value.name.trim() ? value.name : `Tourist ${index + 1}`,
    tripId: typeof value?.tripId === "string" && value.tripId.trim() ? value.tripId : "DEFAULT",
    currentLocation: normalizeLocation(value?.currentLocation ?? null, value?.lat, value?.lng),
    safetyScore: isFiniteNumber(value?.safetyScore) ? value.safetyScore : 100,
    status: typeof value?.status === "string" && value.status.trim() ? value.status : "Active",
    lastPing: typeof value?.lastPing === "string" ? value.lastPing : new Date().toISOString(),
    lat: isFiniteNumber(value?.lat) ? value.lat : null,
    lng: isFiniteNumber(value?.lng) ? value.lng : null,
  }
}

function normalizeAlert(value: RawBackendAlert, index: number): DashboardAlert {
  const touristId =
    (typeof value?.touristId === "string" && value.touristId.trim()) ||
    (typeof value?.userId === "string" && value.userId.trim()) ||
    "UNKNOWN"

  return {
    _id: typeof value?._id === "string" ? value._id : undefined,
    alertId:
      (typeof value?.alertId === "string" && value.alertId.trim()) ||
      (typeof value?._id === "string" && value._id) ||
      `alert-${touristId}-${index}`,
    touristId,
    tripId: typeof value?.tripId === "string" && value.tripId.trim() ? value.tripId : "DEFAULT",
    type: typeof value?.type === "string" && value.type.trim() ? value.type : "Unknown",
    status: typeof value?.status === "string" && value.status.trim() ? value.status : "Active",
    timestamp: typeof value?.timestamp === "string" ? value.timestamp : new Date().toISOString(),
    location: normalizeLocation(value?.location ?? null, value?.lat, value?.lng),
    lat: isFiniteNumber(value?.lat) ? value.lat : null,
    lng: isFiniteNumber(value?.lng) ? value.lng : null,
  }
}

export async function GET() {
  try {
    const backendData = await fetchBackendJson<BackendTripsEnvelope>("/api/admin/trips", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const safeTrips = Array.isArray(backendData?.data?.trips) ? backendData.data.trips : []
    const trips: DashboardTrip[] = safeTrips.map((trip, tripIndex) => {
      const normalizedTourists = Array.isArray(trip?.tourists)
        ? trip.tourists
            .map((tourist, touristIndex) => normalizeTourist(tourist, touristIndex))
            .filter((tourist): tourist is DashboardTourist => tourist !== null)
        : []

      const uniqueTourists = Array.from(
        normalizedTourists.reduce<Map<string, DashboardTourist>>((acc, tourist) => {
          acc.set(tourist.blockchainId, tourist)
          return acc
        }, new Map()).values()
      )

      const normalizedAlerts = Array.isArray(trip?.alerts)
        ? trip.alerts.map((alert, alertIndex) => normalizeAlert(alert, alertIndex))
        : []

      return {
        _id: typeof trip?._id === "string" && trip._id.trim() ? trip._id : `trip-${tripIndex}`,
        tripId: typeof trip?.tripId === "string" && trip.tripId.trim() ? trip.tripId : `TRIP-${tripIndex + 1}`,
        title:
          (typeof trip?.title === "string" && trip.title.trim()) ||
          (typeof trip?.name === "string" && trip.name.trim()) ||
          `Trip ${tripIndex + 1}`,
        name: typeof trip?.name === "string" && trip.name.trim() ? trip.name : undefined,
        destination: typeof trip?.destination === "string" && trip.destination.trim() ? trip.destination : undefined,
        startDate: typeof trip?.startDate === "string" ? trip.startDate : undefined,
        endDate: typeof trip?.endDate === "string" ? trip.endDate : undefined,
        status: typeof trip?.status === "string" && trip.status.trim() ? trip.status : undefined,
        touristIds:
          Array.isArray(trip?.touristIds) && trip.touristIds.length > 0
            ? trip.touristIds.filter((touristId): touristId is string => typeof touristId === "string" && touristId.trim().length > 0)
            : uniqueTourists.map((tourist) => tourist.blockchainId),
        touristCount: isFiniteNumber(trip?.touristCount) ? trip.touristCount : uniqueTourists.length,
        tourists: uniqueTourists,
        alerts: normalizedAlerts,
      }
    })

    return NextResponse.json<DashboardTripsResponse>({ trips })
  } catch (error: unknown) {
    console.error("Failed to fetch dashboard trips from backend:", error)
    return NextResponse.json<DashboardTripsResponse>({ error: getErrorMessage(error), trips: [] }, { status: 502 })
  }
}
