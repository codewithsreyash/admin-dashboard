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
    <div className="space-y-8 p-8 pt-8 animate-fade-in">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Trip Management
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
            Create operational trips, review availability, and assign registered tourists from one control surface.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="group inline-flex h-11 items-center rounded-2xl border border-border/50 bg-secondary/50 backdrop-blur-xl px-6 text-sm font-medium transition-all duration-300 hover:bg-primary/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
          >
            <svg className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Return to Dashboard
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex gap-4 rounded-2xl border border-destructive/30 bg-destructive/10 backdrop-blur-xl p-5 shadow-lg shadow-destructive/5">
          <div className="p-2 rounded-xl bg-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div className="text-sm text-destructive">{error}</div>
        </div>
      )}

      {successMessage && (
        <div className="flex gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl p-5 shadow-lg shadow-emerald-500/5">
          <div className="p-2 rounded-xl bg-emerald-500/20">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="text-sm text-emerald-400">{successMessage}</div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.35fr)]">
        <Card className="glass-card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 rounded-xl bg-primary/15 border border-primary/20">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              Create New Trip
            </CardTitle>
            <CardDescription className="mt-2 leading-relaxed">
              New trips immediately become available to the live-map and assignment tools once created.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleCreateTrip}>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Trip Name
                </label>
                <input
                  required
                  value={formState.name}
                  onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Golden Triangle Escort"
                  className="h-12 w-full rounded-xl border border-border/50 bg-secondary/30 backdrop-blur-xl px-4 text-sm outline-none transition-all duration-300 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 hover:bg-secondary/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  Destination
                </label>
                <input
                  required
                  value={formState.destination}
                  onChange={(event) => setFormState((current) => ({ ...current, destination: event.target.value }))}
                  placeholder="Delhi, Agra, Jaipur"
                  className="h-12 w-full rounded-xl border border-border/50 bg-secondary/30 backdrop-blur-xl px-4 text-sm outline-none transition-all duration-300 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 hover:bg-secondary/50"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    Start Date
                  </label>
                  <input
                    required
                    type="date"
                    value={formState.startDate}
                    onChange={(event) => setFormState((current) => ({ ...current, startDate: event.target.value }))}
                    className="h-12 w-full rounded-xl border border-border/50 bg-secondary/30 backdrop-blur-xl px-4 text-sm outline-none transition-all duration-300 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 hover:bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    End Date
                  </label>
                  <input
                    required
                    type="date"
                    value={formState.endDate}
                    onChange={(event) => setFormState((current) => ({ ...current, endDate: event.target.value }))}
                    className="h-12 w-full rounded-xl border border-border/50 bg-secondary/30 backdrop-blur-xl px-4 text-sm outline-none transition-all duration-300 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 hover:bg-secondary/50"
                  />
                </div>
              </div>

              <Button type="submit" disabled={isCreatingTrip} className="h-12 w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
                {isCreatingTrip ? "Creating trip..." : "Create Trip"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="glass-card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="p-2 rounded-xl bg-accent/15 border border-accent/20">
                <Route className="h-4 w-4 text-accent" />
              </div>
              Fleet Snapshot
            </CardTitle>
            <CardDescription className="mt-2 leading-relaxed">
              Quick operational summary from the same deduplicated trip data the dashboard uses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-5 md:grid-cols-3">
              <div className="group rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-500/30">
                <p className="text-[10px] uppercase tracking-[0.15em] text-emerald-400/80 font-semibold">Active Trips</p>
                <p className="mt-3 text-3xl font-bold text-emerald-400">{activeTrips.length}</p>
              </div>
              <div className="group rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/15 to-sky-500/5 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/10 hover:border-sky-500/30">
                <p className="text-[10px] uppercase tracking-[0.15em] text-sky-400/80 font-semibold">Registered Tourists</p>
                <p className="mt-3 text-3xl font-bold text-sky-400">{tourists.length}</p>
              </div>
              <div className="group rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/15 to-amber-500/5 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10 hover:border-amber-500/30">
                <p className="text-[10px] uppercase tracking-[0.15em] text-amber-400/80 font-semibold">Unassigned</p>
                <p className="mt-3 text-3xl font-bold text-amber-400">{unassignedTourists.length}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {trips.length === 0 && !isLoading && (
                <div className="col-span-full rounded-2xl border border-dashed border-border/50 p-8 text-center backdrop-blur-xl">
                  <div className="p-4 rounded-2xl bg-muted/20 border border-border/30 inline-block mb-4">
                    <Route className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground">No trips exist yet. Create the first trip to begin assignment.</p>
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
                    className={`group rounded-2xl border p-5 text-left transition-all duration-300 backdrop-blur-xl ${
                      isSelected
                        ? "border-primary/40 bg-primary/10 shadow-lg shadow-primary/10"
                        : "border-border/30 bg-secondary/20 hover:border-primary/30 hover:bg-primary/5 hover:shadow-lg"
                    } ${!isActive ? "opacity-70" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{trip.title}</p>
                        <p className="text-xs text-muted-foreground">{trip.destination || "Destination pending"}</p>
                      </div>
                      <Badge className={`border shadow-sm ${getStatusClasses(trip.status)}`}>{trip.status || "Unknown"}</Badge>
                    </div>
                    <div className="mt-5 space-y-2.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2.5">
                        <CalendarRange className="h-3.5 w-3.5" />
                        <span>{formatDateRange(trip)}</span>
                      </div>
                      <div className="flex items-center gap-2.5">
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
