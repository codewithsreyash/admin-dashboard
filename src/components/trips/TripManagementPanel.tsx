"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import type { FormEvent } from "react"
import type { DashboardTourist, DashboardTrip, DashboardTripsResponse } from "@/lib/dashboard-types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CalendarRange, CheckCircle2, MapPinned, Plus, Route, Users } from "lucide-react"

type TouristEnvelope = {
  status?: string
  data?: {
    tourists?: Array<Partial<DashboardTourist>>
  }
  error?: string
  message?: string
}

const EMPTY_FORM = {
  name: "",
  destination: "",
  startDate: "",
  endDate: "",
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value)
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const raw = await response.text()
  if (!raw) {
    return {} as T
  }

  return JSON.parse(raw) as T
}

function normalizeTourist(value: Partial<DashboardTourist>, index: number): DashboardTourist | null {
  const touristId =
    (typeof value?.blockchainId === "string" && value.blockchainId.trim()) ||
    (typeof value?.id === "string" && value.id.trim()) ||
    null

  if (!touristId) {
    return null
  }

  const lat = isFiniteNumber(value?.currentLocation?.lat)
    ? value.currentLocation.lat
    : isFiniteNumber(value?.lat)
      ? value.lat
      : null
  const lng = isFiniteNumber(value?.currentLocation?.lng)
    ? value.currentLocation.lng
    : isFiniteNumber(value?.lng)
      ? value.lng
      : null

  return {
    _id: typeof value?._id === "string" ? value._id : undefined,
    blockchainId: touristId,
    id: touristId,
    passportHash: typeof value?.passportHash === "string" ? value.passportHash : undefined,
    name: typeof value?.name === "string" && value.name.trim() ? value.name : `Tourist ${index + 1}`,
    tripId: typeof value?.tripId === "string" && value.tripId.trim() ? value.tripId : "DEFAULT",
    currentLocation: lat !== null && lng !== null ? { lat, lng } : null,
    safetyScore: isFiniteNumber(value?.safetyScore) ? value.safetyScore : 100,
    status: typeof value?.status === "string" && value.status.trim() ? value.status : "Active",
    lastPing: typeof value?.lastPing === "string" ? value.lastPing : new Date().toISOString(),
    lat,
    lng,
  }
}

function formatDateLabel(value?: string) {
  if (!value) {
    return "TBD"
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "TBD" : date.toLocaleDateString()
}

function formatDateRange(trip: DashboardTrip) {
  const start = formatDateLabel(trip.startDate)
  const end = formatDateLabel(trip.endDate)
  return `${start} - ${end}`
}

function getStatusClasses(status?: string) {
  switch (status) {
    case "Active":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
    case "Scheduled":
      return "border-sky-400/30 bg-sky-500/10 text-sky-300"
    case "Completed":
      return "border-zinc-400/30 bg-zinc-500/10 text-zinc-300"
    case "Cancelled":
      return "border-red-400/30 bg-red-500/10 text-red-300"
    default:
      return "border-border bg-muted text-muted-foreground"
  }
}

export function TripManagementPanel() {
  const [trips, setTrips] = useState<DashboardTrip[]>([])
  const [tourists, setTourists] = useState<DashboardTourist[]>([])
  const [selectedTripId, setSelectedTripId] = useState("")
  const [selectedTouristIds, setSelectedTouristIds] = useState<string[]>([])
  const [formState, setFormState] = useState(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreatingTrip, setIsCreatingTrip] = useState(false)
  const [isSavingAssignments, setIsSavingAssignments] = useState(false)

  const loadData = useCallback(async (preferredTripId?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const [tripResponse, touristResponse] = await Promise.all([
        fetch("/api/dashboard/trips", {
          method: "GET",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
        }),
        fetch("/api/admin/tourists", {
          method: "GET",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
        }),
      ])

      const tripsPayload = await readJsonResponse<DashboardTripsResponse>(tripResponse)
      const touristsPayload = await readJsonResponse<TouristEnvelope>(touristResponse)

      if (!tripResponse.ok) {
        throw new Error(tripsPayload?.error || `Trip API returned ${tripResponse.status}`)
      }

      if (!touristResponse.ok) {
        throw new Error(
          touristsPayload?.error ||
            touristsPayload?.message ||
            `Tourist API returned ${touristResponse.status}`
        )
      }

      const normalizedTrips = Array.isArray(tripsPayload?.trips) ? tripsPayload.trips : []
      const normalizedTourists = Array.isArray(touristsPayload?.data?.tourists)
        ? Array.from(
            touristsPayload.data.tourists
              .map((tourist, index) => normalizeTourist(tourist, index))
              .filter((tourist): tourist is DashboardTourist => tourist !== null)
              .reduce<Map<string, DashboardTourist>>((acc, tourist) => {
                acc.set(tourist.blockchainId, tourist)
                return acc
              }, new Map()).values()
          )
        : []

      const activeTripIds = normalizedTrips
        .filter((trip) => trip.status === "Active")
        .map((trip) => trip.tripId)

      setTrips(normalizedTrips)
      setTourists(normalizedTourists)
      setSelectedTripId((current) =>
        (preferredTripId && activeTripIds.includes(preferredTripId) && preferredTripId) ||
        (current && activeTripIds.includes(current) && current) ||
        activeTripIds[0] ||
        ""
      )
    } catch (loadError: unknown) {
      console.error("Trip management load failed:", loadError)
      setTrips([])
      setTourists([])
      setSelectedTripId("")
      setError(loadError instanceof Error ? loadError.message : "Unable to load trip management data.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (!selectedTripId) {
      setSelectedTouristIds([])
      return
    }

    const selectedTrip = trips.find((trip) => trip.tripId === selectedTripId)
    const assignedIds =
      selectedTrip?.touristIds && selectedTrip.touristIds.length > 0
        ? selectedTrip.touristIds
        : tourists
            .filter((tourist) => tourist.tripId === selectedTripId)
            .map((tourist) => tourist.blockchainId)

    setSelectedTouristIds(Array.from(new Set(assignedIds)))
  }, [selectedTripId, trips, tourists])

  const activeTrips = trips.filter((trip) => trip.status === "Active")
  const selectedTrip = trips.find((trip) => trip.tripId === selectedTripId) || null
  const selectionSet = new Set(selectedTouristIds)
  const unassignedTourists = tourists.filter((tourist) => tourist.tripId === "DEFAULT")

  async function handleCreateTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsCreatingTrip(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch("/api/admin/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formState.name,
          destination: formState.destination,
          startDate: new Date(formState.startDate).toISOString(),
          endDate: new Date(formState.endDate).toISOString(),
        }),
      })

      const payload = await readJsonResponse<{
        error?: string
        message?: string
        data?: {
          trip?: DashboardTrip
        }
      }>(response)

      if (!response.ok) {
        throw new Error(payload?.error || payload?.message || `Trip creation failed with ${response.status}`)
      }

      const createdTripId = payload?.data?.trip?.tripId || selectedTripId
      setFormState(EMPTY_FORM)
      setSuccessMessage("Trip created successfully. You can now assign tourists to it.")
      await loadData(createdTripId)
    } catch (createError: unknown) {
      console.error("Trip creation failed:", createError)
      setError(createError instanceof Error ? createError.message : "Unable to create trip.")
    } finally {
      setIsCreatingTrip(false)
    }
  }

  async function handleAssignTourists() {
    if (!selectedTripId) {
      setError("Select an active trip before assigning tourists.")
      return
    }

    setIsSavingAssignments(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch(`/api/admin/trips/${encodeURIComponent(selectedTripId)}/tourists`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ touristIds: selectedTouristIds }),
      })

      const payload = await readJsonResponse<{
        error?: string
        message?: string
      }>(response)

      if (!response.ok) {
        throw new Error(payload?.error || payload?.message || `Tourist assignment failed with ${response.status}`)
      }

      setSuccessMessage(`Assignments saved for ${selectedTripId}.`)
      await loadData(selectedTripId)
    } catch (assignmentError: unknown) {
      console.error("Trip assignment failed:", assignmentError)
      setError(assignmentError instanceof Error ? assignmentError.message : "Unable to save assignments.")
    } finally {
      setIsSavingAssignments(false)
    }
  }

  function toggleTourist(touristId: string) {
    setSelectedTouristIds((current) =>
      current.includes(touristId)
        ? current.filter((id) => id !== touristId)
        : [...current, touristId]
    )
  }

  return (
    <div className="space-y-6 p-8 pt-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trip Management</h1>
          <p className="text-sm text-muted-foreground">
            Create operational trips, review availability, and assign registered tourists from one control surface.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-9 items-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {successMessage && (
        <div className="flex gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>{successMessage}</div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.35fr)]">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Create New Trip
            </CardTitle>
            <CardDescription>
              New trips immediately become available to the live-map and assignment tools once created.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateTrip}>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Trip Name
                </label>
                <input
                  required
                  value={formState.name}
                  onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Golden Triangle Escort"
                  className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none ring-0 transition focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Destination
                </label>
                <input
                  required
                  value={formState.destination}
                  onChange={(event) => setFormState((current) => ({ ...current, destination: event.target.value }))}
                  placeholder="Delhi, Agra, Jaipur"
                  className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none ring-0 transition focus:border-primary"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Start Date
                  </label>
                  <input
                    required
                    type="date"
                    value={formState.startDate}
                    onChange={(event) => setFormState((current) => ({ ...current, startDate: event.target.value }))}
                    className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none ring-0 transition focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    End Date
                  </label>
                  <input
                    required
                    type="date"
                    value={formState.endDate}
                    onChange={(event) => setFormState((current) => ({ ...current, endDate: event.target.value }))}
                    className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none ring-0 transition focus:border-primary"
                  />
                </div>
              </div>

              <Button type="submit" disabled={isCreatingTrip} className="h-11 w-full">
                {isCreatingTrip ? "Creating trip..." : "Create Trip"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-4 w-4 text-primary" />
              Fleet Snapshot
            </CardTitle>
            <CardDescription>
              Quick operational summary from the same deduplicated trip data the dashboard uses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Active Trips</p>
                <p className="mt-2 text-3xl font-semibold text-emerald-100">{activeTrips.length}</p>
              </div>
              <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-sky-200/80">Registered Tourists</p>
                <p className="mt-2 text-3xl font-semibold text-sky-100">{tourists.length}</p>
              </div>
              <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-200/80">Unassigned</p>
                <p className="mt-2 text-3xl font-semibold text-amber-100">{unassignedTourists.length}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {trips.length === 0 && !isLoading && (
                <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  No trips exist yet. Create the first trip to begin assignment.
                </div>
              )}

              {trips.map((trip) => {
                const isSelected = trip.tripId === selectedTripId
                const isActive = trip.status === "Active"

                return (
                  <button
                    key={trip.tripId}
                    type="button"
                    onClick={() => {
                      if (isActive) {
                        setSelectedTripId(trip.tripId)
                      }
                    }}
                    className={`rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                        : "border-border bg-background/80 hover:border-primary/40 hover:bg-muted/40"
                    } ${!isActive ? "opacity-80" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{trip.title}</p>
                        <p className="text-xs text-muted-foreground">{trip.destination || "Destination pending"}</p>
                      </div>
                      <Badge className={`border ${getStatusClasses(trip.status)}`}>{trip.status || "Unknown"}</Badge>
                    </div>
                    <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarRange className="h-3.5 w-3.5" />
                        <span>{formatDateRange(trip)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5" />
                        <span>{trip.touristCount ?? trip.tourists.length} tourists assigned</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPinned className="h-4 w-4 text-primary" />
              Active Assignment Target
            </CardTitle>
            <CardDescription>
              Only active trips are assignable here so the live map and incident feed stay operationally scoped.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Select Active Trip
              </label>
              <select
                value={selectedTripId}
                onChange={(event) => setSelectedTripId(event.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary"
              >
                <option value="">Choose an active trip</option>
                {activeTrips.map((trip) => (
                  <option key={trip.tripId} value={trip.tripId}>
                    {trip.title} ({trip.touristCount ?? trip.tourists.length})
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl border border-border bg-background/60 p-4">
              {selectedTrip ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold">{selectedTrip.title}</p>
                    <p className="text-xs text-muted-foreground">{selectedTrip.destination || "Destination pending"}</p>
                  </div>
                  <Badge className={`border ${getStatusClasses(selectedTrip.status)}`}>
                    {selectedTrip.status || "Unknown"}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{formatDateRange(selectedTrip)}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No active trip is currently selected. Create a trip with dates covering today to make it active.
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Button
                variant="outline"
                disabled={!selectedTripId}
                onClick={() => setSelectedTouristIds(tourists.map((tourist) => tourist.blockchainId))}
              >
                Select All Tourists
              </Button>
              <Button
                variant="outline"
                disabled={!selectedTripId}
                onClick={() =>
                  setSelectedTouristIds(
                    tourists
                      .filter((tourist) => tourist.tripId === selectedTripId)
                      .map((tourist) => tourist.blockchainId)
                  )
                }
              >
                Restore Current Assignment
              </Button>
              <Button variant="outline" disabled={!selectedTripId} onClick={() => setSelectedTouristIds([])}>
                Clear Selection
              </Button>
              <Button disabled={!selectedTripId || isSavingAssignments} onClick={handleAssignTourists}>
                {isSavingAssignments ? "Saving assignments..." : "Save Tourist Assignment"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Tourist Assignment Checklist
            </CardTitle>
            <CardDescription>
              Selecting a tourist here will move them onto the chosen active trip if they are currently assigned elsewhere.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>{selectedTouristIds.length} selected</span>
              <span>{tourists.length} tourists available</span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {tourists.length === 0 && !isLoading && (
                <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  No tourists are registered yet.
                </div>
              )}

              {tourists.map((tourist) => {
                const isSelected = selectionSet.has(tourist.blockchainId)
                const isReassignment =
                  selectedTripId.length > 0 &&
                  tourist.tripId !== "DEFAULT" &&
                  tourist.tripId !== selectedTripId

                return (
                  <button
                    key={tourist.blockchainId}
                    type="button"
                    disabled={!selectedTripId}
                    onClick={() => toggleTourist(tourist.blockchainId)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                        : "border-border bg-background/80 hover:border-primary/40 hover:bg-muted/40"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{tourist.name}</p>
                        <p className="text-[11px] font-mono text-muted-foreground">{tourist.blockchainId}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={`border ${tourist.tripId === "DEFAULT" ? "border-amber-400/30 bg-amber-500/10 text-amber-200" : "border-sky-400/30 bg-sky-500/10 text-sky-200"}`}>
                          {tourist.tripId === "DEFAULT" ? "Unassigned" : tourist.tripId}
                        </Badge>
                        <Badge className={`border ${tourist.status === "Panic" ? "border-red-400/30 bg-red-500/10 text-red-200" : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"}`}>
                          {tourist.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Safety score</span>
                        <span className="font-semibold text-foreground">{tourist.safetyScore}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Location</span>
                        <span className="font-semibold text-foreground">
                          {tourist.currentLocation
                            ? `${tourist.currentLocation.lat.toFixed(3)}, ${tourist.currentLocation.lng.toFixed(3)}`
                            : "Awaiting ping"}
                        </span>
                      </div>
                      {isReassignment && (
                        <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100">
                          Will move from {tourist.tripId} to {selectedTripId}.
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
