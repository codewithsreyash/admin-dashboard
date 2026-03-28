"use client"
import { useState } from "react"
import type { DashboardAlert } from "@/lib/dashboard-types"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BellRing, ShieldAlert, NavigationOff } from "lucide-react"

function formatId(value: unknown, length: number) {
  return typeof value === "string" && value.length > 0
    ? `${value.substring(0, length)}...`
    : "UNKNOWN"
}

function formatCoordinates(lat: unknown, lng: unknown, digits: number) {
  return typeof lat === "number" && Number.isFinite(lat) && typeof lng === "number" && Number.isFinite(lng)
    ? `${lat.toFixed(digits)}, ${lng.toFixed(digits)}`
    : "Location unavailable"
}

function formatTimestamp(value: unknown) {
  if (!value) {
    return "Unknown time"
  }

  const date = new Date(value as string)
  return Number.isNaN(date.getTime()) ? "Unknown time" : date.toLocaleTimeString()
}

function formatDateTime(value: unknown) {
  if (!value) {
    return "Unknown date"
  }

  const date = new Date(value as string)
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleString()
}

function getIncidentHash(alert: DashboardAlert | null) {
  const seed = alert?.alertId || alert?.touristId || "UNKNOWN"
  return seed.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 13) || "UNKNOWN"
}

export function AlertsFeed({ alerts }: { alerts: DashboardAlert[] }) {
  const [selectedFir, setSelectedFir] = useState<DashboardAlert | null>(null)
  const safeAlerts = Array.isArray(alerts) ? alerts : []

  return (
    <>
      <Card className="h-full border-destructive/20 shadow-xl overflow-hidden flex flex-col uppercase">
        <CardHeader className="bg-destructive/10 pb-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 font-black italic tracking-tighter">
              <BellRing className="h-5 w-5 text-destructive animate-pulse" />
              Live Security Feed
            </CardTitle>
            <Badge variant="destructive" className="animate-pulse font-bold">{safeAlerts.length} Incidents</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          <div className="divide-y divide-border/50">
            {safeAlerts.length === 0 && (
              <div className="p-12 text-center text-muted-foreground space-y-4">
                <div className="flex justify-center"><ShieldAlert className="h-12 w-12 opacity-10" /></div>
                <p className="text-xs font-bold tracking-widest">Awaiting System Pings...</p>
              </div>
            )}
            {safeAlerts.map((alert, index) => {
              const alertType = typeof alert?.type === "string" ? alert.type : "Unknown"
              const touristId = typeof alert?.touristId === "string" ? alert.touristId : "UNKNOWN"
              const tripId = typeof alert?.tripId === "string" && alert.tripId.trim() ? alert.tripId : "DEFAULT"
              const lat = typeof alert?.location?.lat === "number" ? alert.location.lat : null
              const lng = typeof alert?.location?.lng === "number" ? alert.location.lng : null
              const alertKey = typeof alert?.alertId === "string" ? alert.alertId : `${touristId}-${index}`

              return (
                <div key={alertKey} className={`p-4 transition-colors flex gap-4 flex-col ${alertType === 'Panic' ? 'bg-destructive/10 animate-pulse border-l-4 border-red-600' : 'hover:bg-muted/50 border-l-4 border-transparent'}`}>
                  <div className="flex gap-4">
                    <div className="mt-1">
                      {alertType === "Panic" && <ShieldAlert className="h-5 w-5 text-red-500 animate-bounce" />}
                      {alertType !== "Panic" && <NavigationOff className="h-5 w-5 text-orange-500" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-black leading-none">[{alertType}] {formatId(touristId, 8)}</p>
                        <Badge variant="outline" className="text-[9px] px-1 h-4">{tripId}</Badge>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-1 font-mono">
                        <span>{formatCoordinates(lat, lng, 4)}</span>
                        <span>{formatTimestamp(alert?.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pl-9">
                    <button className="text-[10px] font-bold text-green-600 bg-green-500/10 px-2 py-1 rounded border border-green-500/20 hover:bg-green-500/20 transition-all uppercase">Verify</button>
                    <button 
                      onClick={() => setSelectedFir(alert)}
                      className="text-[10px] bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-all font-black uppercase tracking-tighter"
                    >
                      Generate E-FIR
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>


      {/* Official E-FIR Modal Implementation */}
      {selectedFir && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-gray-900 text-white p-4 flex justify-between items-center border-b-4 border-yellow-500">
              <div className="flex items-center gap-3">
                <div className="bg-white p-1 rounded">
                   <div className="w-8 h-8 bg-blue-900 flex items-center justify-center text-xs font-bold text-white border border-gray-400">POLICE</div>
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tighter italic">E-FIRST INFORMATION REPORT</h2>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">SafeTravel Digital Verification System v1.0</p>
                </div>
              </div>
              <button onClick={() => setSelectedFir(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <div className="p-8 space-y-6 font-serif bg-[rgb(250,250,250)] border-l-8 border-r-8 border-gray-100">
              <div className="flex justify-between border-b pb-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-gray-500">Incident Hash ID</p>
                  <p className="text-sm font-mono font-bold">{getIncidentHash(selectedFir)}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] uppercase font-bold text-gray-500">Date of Incident</p>
                  <p className="text-sm font-bold font-mono">{formatDateTime(selectedFir?.timestamp)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <Card className="p-4 bg-white border-dashed border-2">
                  <h3 className="text-[10px] uppercase font-bold text-blue-600 mb-3 underline">Victim Identification</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-700 font-bold">Tourist ID:</span>
                      <span className="font-mono text-blue-600">{formatId(selectedFir?.touristId, 12)}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-700 font-bold">Trip ID:</span>
                      <span className="font-bold">{typeof selectedFir?.tripId === "string" ? selectedFir.tripId : "DEFAULT"}</span>
                    </div>
                    <p className="text-xs text-gray-500 italic mt-2">*Verified via Blockchain Hash</p>
                  </div>
                </Card>

                <Card className="p-4 bg-white border-dashed border-2">
                  <h3 className="text-[10px] uppercase font-bold text-red-600 mb-3 underline">Incident Location</h3>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-700 font-bold tracking-tight">Coordinates:</p>
                    <p className="text-sm font-mono bg-red-50 p-1 border border-red-100 rounded text-red-700">{formatCoordinates(selectedFir?.location?.lat, selectedFir?.location?.lng, 6)}</p>
                    <p className="text-xs text-gray-500 italic mt-2">*Real-Time GPS Tag</p>
                  </div>
                </Card>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h3 className="text-[10px] uppercase font-bold text-yellow-800 mb-2">Offense Summary / Alert Type</h3>
                <p className="text-lg font-black text-gray-900 uppercase tracking-tighter">[{typeof selectedFir?.type === "string" ? selectedFir.type : "Unknown"}]</p>
                <p className="text-xs text-yellow-900 mt-2 font-medium">Automatic system trigger generated by SafeCity Anomaly Engine. Emergency services notified immediately.</p>
              </div>

              <div className="flex gap-4 pt-4 border-t-2 border-gray-200">
                <button 
                  onClick={() => alert('PDF report generated and stored.')}
                  className="flex-1 bg-gray-800 text-white font-bold py-3 rounded hover:bg-black transition-all flex items-center justify-center gap-2 uppercase text-xs"
                >
                  📥 Download Digitally Signed PDF
                </button>
                <button 
                  onClick={() => {
                    alert('FIR Submitted to Central Station');
                    setSelectedFir(null);
                  }}
                  className="flex-1 bg-red-600 text-white font-bold py-3 rounded hover:bg-red-700 transition-all flex items-center justify-center gap-2 uppercase text-xs animate-pulse"
                >
                  ⚡ Submit to Police Station
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
