"use client"
import { useEffect, useState } from "react"
import type { DashboardTrip, DashboardTripsResponse } from "@/lib/dashboard-types"
import { LiveMap } from "@/components/map/LiveMap"
import { AlertsFeed } from "@/components/alerts/AlertsFeed"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Activity, ShieldAlert, Fingerprint, MapPin, AlertTriangle } from "lucide-react"

export default function Dashboard() {
  const [trips, setTrips] = useState<DashboardTrip[]>([])
  const [selectedTripId, setSelectedTripId] = useState<string>("ALL")
  const [stats, setStats] = useState({ active: 0, alerts: 0 })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        if (isMounted) {
          setIsLoading(true)
          setError(null)
        }

        const res = await fetch("/api/dashboard/trips", { 
          method: "GET",
          cache: "no-store",
          headers: { "Content-Type": "application/json" }
        })

        const rawPayload = await res.text()
        let data: DashboardTripsResponse = { trips: [] }

        if (rawPayload) {
          try {
            data = JSON.parse(rawPayload)
          } catch {
            throw new Error("Dashboard API returned invalid JSON")
          }
        }

        if (!res.ok) {
          throw new Error(typeof data?.error === "string" ? data.error : `API returned ${res.status}`)
        }

        const tripsData = Array.isArray(data?.trips) ? data.trips : []

        if (!isMounted) {
          return
        }

        setTrips(tripsData)
        
        let totalActive = 0
        let totalAlerts = 0
        tripsData.forEach((trip) => {
          const tourists = Array.isArray(trip?.tourists) ? trip.tourists : []
          const alerts = Array.isArray(trip?.alerts) ? trip.alerts : []
          totalActive += tourists.length
          totalAlerts += alerts.length
        })
        setStats({ active: totalActive, alerts: totalAlerts })
      } catch (error: unknown) {
        console.error("Dashboard fetch error:", error)
        if (!isMounted) {
          return
        }
        setError(`Unable to connect to server: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setTrips([])
        setStats({ active: 0, alerts: 0 })
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    
    fetchData()
    const interval = window.setInterval(fetchData, 5000)

    return () => {
      isMounted = false
      window.clearInterval(interval)
    }
  }, [])

  const safeTrips = Array.isArray(trips) ? trips : []
  const selectedTripData: Pick<DashboardTrip, "tourists" | "alerts"> = selectedTripId === "ALL" 
    ? { 
        tourists: safeTrips.flatMap(t => Array.isArray(t?.tourists) ? t.tourists : []),
        alerts: safeTrips.flatMap(t => Array.isArray(t?.alerts) ? t.alerts : [])
      }
    : safeTrips.find(t => t?.tripId === selectedTripId) || { tourists: [], alerts: [] }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {error && (
        <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">Connection Error</p>
            <p className="text-xs text-destructive/80">{error}</p>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Overview</h2>
          <p className="text-muted-foreground text-sm">Monitoring live tourist security & blockchain identity.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Active Trip Filter</span>
            <select 
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              className="bg-background border rounded-md px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
            >
              <option value="ALL">All Active Trips</option>
              {safeTrips.map(trip => (
                <option key={trip?.tripId} value={trip?.tripId}>{trip?.tripId} ({Array.isArray(trip?.tourists) ? trip.tourists.length : 0})</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Live Tourists" value={isLoading ? "—" : stats?.active?.toString() || "0"} icon={<Users />} />
        <MetricCard title="System Pings / min" value={isLoading ? "—" : "Real-Time"} icon={<Activity />} />
        <MetricCard title="Active Incidents" value={isLoading ? "—" : stats?.alerts?.toString() || "0"} icon={<ShieldAlert className={!isLoading && (stats?.alerts || 0) > 0 ? "text-destructive animate-pulse" : "text-muted-foreground"} />} />
        <MetricCard title="Blockchain Verifications" value="100%" icon={<Fingerprint className="text-green-500" />} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 h-[650px]">
        <div className="col-span-4 h-full flex flex-col">
          <Card className="flex-1 border shadow-sm flex flex-col overflow-hidden">
            <CardHeader className="py-4 border-b bg-muted/5">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Live Map Tracking: {selectedTripId}
                </CardTitle>
                <div className="flex gap-2">
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" /> <span className="text-[10px] font-medium">Safe</span></div>
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500" /> <span className="text-[10px] font-medium">Warning</span></div>
                   <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /> <span className="text-[10px] font-medium">Panic</span></div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 relative">
              <LiveMap tourists={Array.isArray(selectedTripData?.tourists) ? selectedTripData.tourists : []} />
            </CardContent>
          </Card>
        </div>
        <div className="col-span-3 h-full">
          <AlertsFeed alerts={Array.isArray(selectedTripData?.alerts) ? selectedTripData.alerts : []} />
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-4 w-4 text-primary opacity-70">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  )
}
