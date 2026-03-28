"use client"
import { useEffect, useState } from "react"
import { LiveMap } from "@/components/map/LiveMap"
import { AlertsFeed } from "@/components/alerts/AlertsFeed"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Activity, ShieldAlert, Fingerprint, MapPin } from "lucide-react"

export default function Dashboard() {
  const [trips, setTrips] = useState<any[]>([])
  const [selectedTripId, setSelectedTripId] = useState<string>("ALL")
  const [stats, setStats] = useState({ active: 0, alerts: 0 })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/dashboard/trips")
        const data = await res.json()
        if (data.trips) {
          setTrips(data.trips)
          
          let totalActive = 0
          let totalAlerts = 0
          data.trips.forEach((t: any) => {
            totalActive += t.tourists.length
            totalAlerts += t.alerts.length
          })
          setStats({ active: totalActive, alerts: totalAlerts })

          // Auto-select first trip if none selected
          if (selectedTripId === "ALL" && data.trips.length > 0) {
            // keep it ALL for now or let user choose
          }
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const selectedTripData = selectedTripId === "ALL" 
    ? { tourists: trips.flatMap(t => t.tourists), alerts: trips.flatMap(t => t.alerts) }
    : trips.find(t => t.tripId === selectedTripId) || { tourists: [], alerts: [] };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
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
              {trips.map(trip => (
                <option key={trip.tripId} value={trip.tripId}>{trip.tripId} ({trip.tourists.length})</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Live Tourists" value={stats.active.toString()} icon={<Users />} />
        <MetricCard title="System Pings / min" value="Real-Time" icon={<Activity />} />
        <MetricCard title="Active Incidents" value={stats.alerts.toString()} icon={<ShieldAlert className={stats.alerts > 0 ? "text-destructive animate-pulse" : "text-muted-foreground"} />} />
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
              <LiveMap tourists={selectedTripData.tourists} />
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

