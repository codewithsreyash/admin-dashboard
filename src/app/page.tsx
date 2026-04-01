"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type {
  DashboardAlert,
  DashboardAlertEvent,
  DashboardLocationUpdateEvent,
  DashboardTourist,
  DashboardTrip,
  DashboardTripsResponse,
} from "@/lib/dashboard-types"
import { DASHBOARD_SOCKET_EVENTS, disconnectDashboardSocket, getDashboardSocket } from "@/lib/socket"
import { getTouristSignalMeta, SIGNAL_REFRESH_INTERVAL_MS, STALE_SIGNAL_THRESHOLD_MS } from "@/lib/signal-status"
import { LiveMap } from "@/components/map/LiveMap"
import { TouristSignalList } from "@/components/map/TouristSignalList"
import { AlertsFeed } from "@/components/alerts/AlertsFeed"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, AlertTriangle, CalendarRange, MapPin, Route, ShieldAlert, Users, Wifi } from "lucide-react"

const DEFAULT_TRIP_ID = "DEFAULT"

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error"
}

function sortAlertsByNewest(alerts: DashboardAlert[]) {
  return [...alerts].sort((left, right) => {
    const leftTime = new Date(left.timestamp || 0).getTime()
    const rightTime = new Date(right.timestamp || 0).getTime()
    return rightTime - leftTime
  })
}

function mergeUniqueTourists(tourists: DashboardTourist[]) {
  return tourists.reduce<DashboardTourist[]>((uniqueTourists, tourist) => upsertTourist(uniqueTourists, tourist), [])
}

function createSocketTripPlaceholder(tripId: string, tourist?: DashboardTourist | null, alert?: DashboardAlert | null): DashboardTrip {
  const tourists = tourist ? [tourist] : []
  const alerts = alert ? [alert] : []

  return {
    _id: `socket-${tripId}`,
    tripId,
    title: tripId,
    destination: "Live stream only",
    status: "Active",
    touristIds: tourists.map((entry) => entry.blockchainId),
    touristCount: tourists.length,
    tourists,
    alerts,
  }
}

function withTripSummary(trip: DashboardTrip, tourists: DashboardTourist[], alerts: DashboardAlert[]) {
  return {
    ...trip,
    tourists,
    touristIds: tourists.map((tourist) => tourist.blockchainId),
    touristCount: tourists.length,
    alerts: sortAlertsByNewest(alerts),
  }
}

function upsertTourist(tourists: DashboardTourist[], tourist: DashboardTourist) {
  const nextTourists = [...tourists]
  const existingIndex = nextTourists.findIndex((entry) => entry.blockchainId === tourist.blockchainId)

  if (existingIndex === -1) {
    nextTourists.push(tourist)
  } else {
    nextTourists[existingIndex] = {
      ...nextTourists[existingIndex],
      ...tourist,
    }
  }

  return nextTourists
}

function removeTourist(tourists: DashboardTourist[], touristId: string) {
  return tourists.filter((tourist) => tourist.blockchainId !== touristId)
}

function upsertAlert(alerts: DashboardAlert[], alert: DashboardAlert) {
  const nextAlerts = [...alerts]
  const existingIndex = nextAlerts.findIndex((entry) => entry.alertId === alert.alertId)

  if (existingIndex === -1) {
    nextAlerts.unshift(alert)
  } else {
    nextAlerts[existingIndex] = {
      ...nextAlerts[existingIndex],
      ...alert,
    }
  }

  return sortAlertsByNewest(nextAlerts)
}

function applyLocationUpdate(currentTrips: DashboardTrip[], event: DashboardLocationUpdateEvent) {
  const tourist = event.tourist
  const touristId = tourist?.blockchainId || event.touristId
  const targetTripId = tourist?.tripId || event.tripId || DEFAULT_TRIP_ID
  let targetTripFound = false

  const nextTrips = currentTrips.map((trip) => {
    const hasTourist = trip.tourists.some((entry) => entry.blockchainId === touristId)

    if (trip.tripId === targetTripId) {
      targetTripFound = true
      if (!tourist) {
        return trip
      }

      return withTripSummary(trip, upsertTourist(trip.tourists, tourist), trip.alerts)
    }

    if (hasTourist) {
      return withTripSummary(trip, removeTourist(trip.tourists, touristId), trip.alerts)
    }

    return trip
  })

  if (!targetTripFound && tourist) {
    return [createSocketTripPlaceholder(targetTripId, tourist), ...nextTrips]
  }

  return nextTrips
}

function applyAlertUpdate(currentTrips: DashboardTrip[], event: DashboardAlertEvent) {
  const tourist = event.tourist
  const alert = event.alert
  const touristId = tourist?.blockchainId || event.touristId
  const targetTripId = tourist?.tripId || alert?.tripId || event.tripId || DEFAULT_TRIP_ID
  let targetTripFound = false

  const nextTrips = currentTrips.map((trip) => {
    const hasTourist = trip.tourists.some((entry) => entry.blockchainId === touristId)

    if (trip.tripId === targetTripId) {
      targetTripFound = true
      const nextTourists = tourist ? upsertTourist(trip.tourists, tourist) : trip.tourists
      const nextAlerts = alert ? upsertAlert(trip.alerts, alert) : trip.alerts
      return withTripSummary(trip, nextTourists, nextAlerts)
    }

    if (tourist && hasTourist) {
      return withTripSummary(trip, removeTourist(trip.tourists, touristId), trip.alerts)
    }

    return trip
  })

  if (!targetTripFound) {
    return [createSocketTripPlaceholder(targetTripId, tourist, alert), ...nextTrips]
  }

  return nextTrips
}

export default function Dashboard() {
  const [trips, setTrips] = useState<DashboardTrip[]>([])
  const [selectedTripId, setSelectedTripId] = useState<string>("ALL")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [socketStatus, setSocketStatus] = useState<"Connecting" | "Live" | "Reconnecting" | "Offline">("Connecting")
  const [signalNowMs, setSignalNowMs] = useState(() => Date.now())
  const selectedTripIdRef = useRef(selectedTripId)
  const hasInitializedSelection = useRef(false)

  const loadTrips = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/dashboard/trips", {
        method: "GET",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
      })

      const rawPayload = await response.text()
      let payload: DashboardTripsResponse = { trips: [] }

      if (rawPayload) {
        payload = JSON.parse(rawPayload) as DashboardTripsResponse
      }

      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string" ? payload.error : `Dashboard API returned ${response.status}`
        )
      }

      setTrips(Array.isArray(payload?.trips) ? payload.trips : [])
    } catch (fetchError: unknown) {
      console.error("Dashboard bootstrap fetch error:", fetchError)
      setTrips([])
      setError(`Unable to connect to server: ${getErrorMessage(fetchError)}`)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTrips()
  }, [loadTrips])

  useEffect(() => {
    const socket = getDashboardSocket()
    socket.auth = {
      role: "admin",
      tripId: selectedTripIdRef.current,
    }

    const handleConnect = () => {
      setSocketStatus("Live")
      socket.emit(DASHBOARD_SOCKET_EVENTS.adminJoinTripRoom, {
        tripId: selectedTripIdRef.current,
      })
    }

    const handleDisconnect = () => {
      setSocketStatus("Reconnecting")
    }

    const handleConnectError = () => {
      setSocketStatus("Reconnecting")
    }

    const handleReconnectAttempt = () => {
      setSocketStatus("Reconnecting")
    }

    const handleReconnectFailed = () => {
      setSocketStatus("Offline")
    }

    const handleSocketError = (payload: { message?: string } | undefined) => {
      setSocketStatus("Offline")
      if (payload?.message) {
        setError(payload.message)
      }
    }

    const handleLocationUpdate = (event: DashboardLocationUpdateEvent) => {
      setTrips((currentTrips) => applyLocationUpdate(currentTrips, event))
    }

    const handleAlertUpdate = (event: DashboardAlertEvent) => {
      setTrips((currentTrips) => applyAlertUpdate(currentTrips, event))
    }

    setSocketStatus("Connecting")
    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)
    socket.on("connect_error", handleConnectError)
    socket.on(DASHBOARD_SOCKET_EVENTS.error, handleSocketError)
    socket.on(DASHBOARD_SOCKET_EVENTS.locationUpdate, handleLocationUpdate)
    socket.on(DASHBOARD_SOCKET_EVENTS.newAlert, handleAlertUpdate)
    socket.io.on("reconnect_attempt", handleReconnectAttempt)
    socket.io.on("reconnect_failed", handleReconnectFailed)
    socket.connect()

    return () => {
      socket.off("connect", handleConnect)
      socket.off("disconnect", handleDisconnect)
      socket.off("connect_error", handleConnectError)
      socket.off(DASHBOARD_SOCKET_EVENTS.error, handleSocketError)
      socket.off(DASHBOARD_SOCKET_EVENTS.locationUpdate, handleLocationUpdate)
      socket.off(DASHBOARD_SOCKET_EVENTS.newAlert, handleAlertUpdate)
      socket.io.off("reconnect_attempt", handleReconnectAttempt)
      socket.io.off("reconnect_failed", handleReconnectFailed)
      disconnectDashboardSocket()
    }
  }, [loadTrips])

  useEffect(() => {
    selectedTripIdRef.current = selectedTripId

    const socket = getDashboardSocket()
    socket.auth = {
      role: "admin",
      tripId: selectedTripId,
    }

    if (socket.connected) {
      socket.emit(DASHBOARD_SOCKET_EVENTS.adminJoinTripRoom, {
        tripId: selectedTripId,
      })
    }

    if (hasInitializedSelection.current) {
      void loadTrips()
    } else {
      hasInitializedSelection.current = true
    }
  }, [loadTrips, selectedTripId])

  useEffect(() => {
    if (selectedTripId === "ALL") {
      return
    }

    if (!trips.some((trip) => trip.tripId === selectedTripId)) {
      setSelectedTripId("ALL")
    }
  }, [selectedTripId, trips])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSignalNowMs(Date.now())
    }, SIGNAL_REFRESH_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const safeTrips = trips
  const selectedTrip =
    selectedTripId === "ALL" ? null : safeTrips.find((trip) => trip.tripId === selectedTripId) || null
  const selectedTripData =
    selectedTripId === "ALL"
      ? {
          tourists: mergeUniqueTourists(safeTrips.flatMap((trip) => trip.tourists || [])),
          alerts: sortAlertsByNewest(safeTrips.flatMap((trip) => trip.alerts || [])),
        }
      : {
          tourists: selectedTrip?.tourists || [],
          alerts: sortAlertsByNewest(selectedTrip?.alerts || []),
        }

  const stats = useMemo(() => {
    const uniqueTourists = mergeUniqueTourists(safeTrips.flatMap((trip) => trip.tourists || []))
    const activeTourists = uniqueTourists.filter((tourist) => !getTouristSignalMeta(tourist, signalNowMs).isStale).length
    const incidentCount = safeTrips.reduce((count, trip) => count + (trip.alerts?.length || 0), 0)
    const activeTripCount = safeTrips.filter((trip) => trip.status === "Active").length

    return {
      active: activeTourists,
      alerts: incidentCount,
      trips: activeTripCount,
    }
  }, [safeTrips, signalNowMs])

  const signalSummary = useMemo(() => {
    const live = selectedTripData.tourists.filter((tourist) => !getTouristSignalMeta(tourist, signalNowMs).isStale).length
    const stale = selectedTripData.tourists.length - live

    return {
      live,
      stale,
    }
  }, [selectedTripData.tourists, signalNowMs])

  return (
    <div className="flex-1 space-y-8 p-8 pt-8 animate-fade-in">
      {error && (
        <div className="flex gap-4 rounded-2xl border border-destructive/30 bg-destructive/10 backdrop-blur-xl p-5 shadow-lg shadow-destructive/5">
          <div className="p-2 rounded-xl bg-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-sm font-semibold text-destructive">Connection Error</p>
            <p className="text-xs text-destructive/70 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            System Overview
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
            Monitoring live tourist security, trip assignments, and incident traffic from deduplicated backend data.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className={`inline-flex h-11 items-center gap-3 rounded-2xl border px-5 text-sm backdrop-blur-xl transition-all duration-300 ${
            socketStatus === "Live" 
              ? "border-primary/30 bg-primary/10 shadow-lg shadow-primary/10" 
              : socketStatus === "Connecting" || socketStatus === "Reconnecting"
                ? "border-warning/30 bg-warning/10"
                : "border-destructive/30 bg-destructive/10"
          }`}>
            <div className="relative">
              <Wifi
                className={`h-4 w-4 ${
                  socketStatus === "Live"
                    ? "text-primary"
                    : socketStatus === "Connecting" || socketStatus === "Reconnecting"
                      ? "text-warning"
                      : "text-destructive"
                }`}
              />
              {socketStatus === "Live" && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
            </div>
            <span className="font-medium">{socketStatus === "Live" ? "Realtime Connected" : socketStatus === "Reconnecting" ? "Reconnecting..." : socketStatus}</span>
          </div>

          <Link
            href="/trips"
            className="group inline-flex h-11 items-center justify-center rounded-2xl border border-border/50 bg-secondary/50 backdrop-blur-xl px-6 text-sm font-medium transition-all duration-300 hover:bg-primary/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
          >
            Open Trip Management
            <svg className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard 
          title="Live Tourists" 
          value={isLoading ? "--" : String(stats.active)} 
          icon={<Users />} 
          color="primary"
          delay={0}
        />
        <MetricCard 
          title="Active Trips" 
          value={isLoading ? "--" : String(stats.trips)} 
          icon={<Route />} 
          color="accent"
          delay={1}
        />
        <MetricCard 
          title="System Status" 
          value={socketStatus === "Live" ? "Online" : "Syncing"} 
          icon={<Activity />} 
          color={socketStatus === "Live" ? "success" : "warning"}
          delay={2}
        />
        <MetricCard
          title="Active Incidents"
          value={isLoading ? "--" : String(stats.alerts)}
          icon={
            <ShieldAlert
              className={!isLoading && stats.alerts > 0 ? "animate-pulse" : ""}
            />
          }
          color={!isLoading && stats.alerts > 0 ? "destructive" : "muted"}
          delay={3}
        />
      </div>

      <div className="grid h-[720px] gap-6 lg:grid-cols-7">
        <div className="col-span-4 h-full">
          <Card className="flex h-full flex-col overflow-hidden glass-card-elevated">
            <CardHeader className="border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent py-5">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="space-y-3">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 rounded-xl bg-primary/15 border border-primary/20">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <span>Live Map Tracking</span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {selectedTrip
                      ? `${selectedTrip.title}${selectedTrip.destination ? ` - ${selectedTrip.destination}` : ""}`
                      : "Viewing all active trip traffic and deduplicated live tourists."}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-[11px]">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      {signalSummary.live} live
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 text-muted-foreground">
                      {signalSummary.stale} signal lost
                    </span>
                    <span className="text-muted-foreground/70">Stale after {Math.round(STALE_SIGNAL_THRESHOLD_MS / 60000)} min</span>
                  </div>
                  {selectedTrip && (
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <CalendarRange className="h-3.5 w-3.5" />
                      <span>
                        {selectedTrip.startDate ? new Date(selectedTrip.startDate).toLocaleDateString() : "TBD"} -{" "}
                        {selectedTrip.endDate ? new Date(selectedTrip.endDate).toLocaleDateString() : "TBD"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      Select Trip
                    </span>
                    <select
                      value={selectedTripId}
                      onChange={(event) => setSelectedTripId(event.target.value)}
                      className="h-11 min-w-[220px] rounded-xl border border-border/50 bg-secondary/30 backdrop-blur-xl px-4 text-sm font-medium outline-none transition-all duration-300 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 hover:bg-secondary/50"
                    >
                      <option value="ALL">All Active Trips</option>
                      {safeTrips.map((trip) => (
                        <option key={trip.tripId} value={trip.tripId}>
                          {trip.title} ({Array.isArray(trip.tourists) ? trip.tourists.length : 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3 pt-6 sm:pt-0">
                    <StatusLegend color="bg-emerald-500" label="Safe" />
                    <StatusLegend color="bg-amber-500" label="Warning" />
                    <StatusLegend color="bg-red-500" label="Panic" />
                    <StatusLegend color="bg-slate-500" label="Lost" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4 p-5">
              <div className="flex-1">
                <LiveMap tourists={selectedTripData.tourists} nowMs={signalNowMs} />
              </div>
              <div className="space-y-4 border-t border-border/30 pt-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Tourist Signal Status</p>
                    <p className="text-xs text-muted-foreground/80">
                      Grey markers indicate last known location after signal went stale.
                    </p>
                  </div>
                  <div className="px-3 py-1.5 rounded-full bg-muted/30 text-xs font-medium text-muted-foreground">
                    {selectedTripData.tourists.length} tourist{selectedTripData.tourists.length === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="max-h-[180px] overflow-y-auto pr-1 scrollbar-thin">
                  <TouristSignalList tourists={selectedTripData.tourists} nowMs={signalNowMs} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-3 h-full">
          <AlertsFeed alerts={selectedTripData.alerts} />
        </div>
      </div>
    </div>
  )
}

function StatusLegend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors cursor-default">
      <div className={`h-2 w-2 rounded-full ${color} shadow-sm`} />
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
    </div>
  )
}

function MetricCard({ 
  title, 
  value, 
  icon, 
  color = "primary",
  delay = 0 
}: { 
  title: string
  value: string
  icon: React.ReactNode
  color?: "primary" | "accent" | "destructive" | "success" | "warning" | "muted"
  delay?: number
}) {
  const colorClasses = {
    primary: "from-primary/20 to-primary/5 border-primary/20 text-primary",
    accent: "from-accent/20 to-accent/5 border-accent/20 text-accent",
    destructive: "from-destructive/20 to-destructive/5 border-destructive/20 text-destructive",
    success: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-500",
    warning: "from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-500",
    muted: "from-muted/50 to-muted/20 border-border/50 text-muted-foreground"
  }

  return (
    <Card 
      className="group glass-card-elevated overflow-visible"
      style={{ animationDelay: `${delay * 100}ms` }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${colorClasses[color]} border transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
          <div className="h-4 w-4">{icon}</div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        <div className={`mt-3 h-1 rounded-full bg-gradient-to-r ${colorClasses[color].replace('from-', 'from-').replace('/20', '/40').replace('/5', '/10')} opacity-60`} />
      </CardContent>
    </Card>
  )
}
