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
      <Card className="h-full glass-card-elevated overflow-hidden flex flex-col">
        <CardHeader className="bg-gradient-to-r from-destructive/10 to-transparent pb-5 border-b border-destructive/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-3 font-bold tracking-tight">
              <div className="p-2 rounded-xl bg-destructive/15 border border-destructive/20">
                <BellRing className="h-4 w-4 text-destructive animate-pulse" />
              </div>
              Live Security Feed
            </CardTitle>
            <Badge variant="destructive" className="px-3 py-1.5 font-semibold shadow-lg shadow-destructive/20">
              {safeAlerts.length} Incidents
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          <div className="divide-y divide-border/20">
            {safeAlerts.length === 0 && (
              <div className="p-16 text-center text-muted-foreground space-y-5">
                <div className="flex justify-center">
                  <div className="p-6 rounded-2xl bg-muted/20 border border-border/30">
                    <ShieldAlert className="h-10 w-10 opacity-20" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold">All Clear</p>
                  <p className="text-xs text-muted-foreground/70">Awaiting system pings...</p>
                </div>
              </div>
            )}
            {safeAlerts.map((alert, index) => {
              const alertType = typeof alert?.type === "string" ? alert.type : "Unknown"
              const touristId = typeof alert?.touristId === "string" ? alert.touristId : "UNKNOWN"
              const tripId = typeof alert?.tripId === "string" && alert.tripId.trim() ? alert.tripId : "DEFAULT"
              const lat = typeof alert?.location?.lat === "number" ? alert.location.lat : null
              const lng = typeof alert?.location?.lng === "number" ? alert.location.lng : null
              const alertKey = typeof alert?.alertId === "string" ? alert.alertId : `${touristId}-${index}`
              const isPanic = alertType === "Panic"

              return (
                <div 
                  key={alertKey} 
                  className={`p-5 transition-all duration-300 flex gap-4 flex-col group ${
                    isPanic 
                      ? "bg-gradient-to-r from-destructive/15 to-transparent border-l-4 border-destructive" 
                      : "hover:bg-muted/20 border-l-4 border-transparent hover:border-warning/50"
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`p-2.5 rounded-xl ${isPanic ? "bg-destructive/20 border border-destructive/30" : "bg-warning/10 border border-warning/20"}`}>
                      {isPanic ? (
                        <ShieldAlert className="h-4 w-4 text-destructive animate-pulse" />
                      ) : (
                        <NavigationOff className="h-4 w-4 text-warning" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-bold leading-none flex items-center gap-2">
                          <span className={isPanic ? "text-destructive" : "text-warning"}>[{alertType}]</span>
                          <span className="text-foreground">{formatId(touristId, 8)}</span>
                        </p>
                        <Badge variant="outline" className="text-[9px] px-2 py-0.5 bg-muted/30 border-border/50">{tripId}</Badge>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                        <span>{formatCoordinates(lat, lng, 4)}</span>
                        <span>{formatTimestamp(alert?.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 pl-12">
                    <button className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 uppercase tracking-wide">
                      Verify
                    </button>
                    <button 
                      onClick={() => setSelectedFir(alert)}
                      className="text-[10px] bg-gradient-to-r from-destructive to-destructive/80 text-white px-4 py-1.5 rounded-lg hover:shadow-lg hover:shadow-destructive/20 transition-all duration-300 font-bold uppercase tracking-wide"
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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-card/95 backdrop-blur-2xl max-w-2xl w-full rounded-3xl shadow-2xl overflow-hidden border border-border/50 animate-slide-up">
            <div className="bg-gradient-to-r from-destructive/20 to-destructive/5 p-6 flex justify-between items-center border-b border-destructive/20">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-destructive/20 border border-destructive/30">
                   <ShieldAlert className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">E-First Information Report</h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-1">SafeTravel Digital Verification System</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedFir(null)} 
                className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-foreground transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex justify-between border-b border-border/30 pb-5">
                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Incident Hash ID</p>
                  <p className="text-sm font-mono font-bold text-primary">{getIncidentHash(selectedFir)}</p>
                </div>
                <div className="space-y-2 text-right">
                  <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Date of Incident</p>
                  <p className="text-sm font-bold font-mono">{formatDateTime(selectedFir?.timestamp)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-primary/5 border border-primary/20">
                  <h3 className="text-[10px] uppercase font-bold text-primary mb-4 tracking-wider">Victim Identification</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Tourist ID:</span>
                      <span className="font-mono text-primary font-semibold">{formatId(selectedFir?.touristId, 12)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-medium">Trip ID:</span>
                      <span className="font-semibold">{typeof selectedFir?.tripId === "string" ? selectedFir.tripId : "DEFAULT"}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 mt-3">*Verified via Blockchain Hash</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-destructive/5 border border-destructive/20">
                  <h3 className="text-[10px] uppercase font-bold text-destructive mb-4 tracking-wider">Incident Location</h3>
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground font-medium">Coordinates:</p>
                    <p className="text-sm font-mono bg-destructive/10 p-2.5 border border-destructive/20 rounded-xl text-destructive font-semibold">{formatCoordinates(selectedFir?.location?.lat, selectedFir?.location?.lng, 6)}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-3">*Real-Time GPS Tag</p>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-warning/10 border border-warning/20 rounded-2xl">
                <h3 className="text-[10px] uppercase font-bold text-warning mb-3 tracking-wider">Offense Summary / Alert Type</h3>
                <p className="text-xl font-bold uppercase tracking-tight">[{typeof selectedFir?.type === "string" ? selectedFir.type : "Unknown"}]</p>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">Automatic system trigger generated by SafeCity Anomaly Engine. Emergency services notified immediately.</p>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => alert('PDF report generated and stored.')}
                  className="flex-1 bg-secondary hover:bg-secondary/80 font-semibold py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 text-sm hover:shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Signed PDF
                </button>
                <button 
                  onClick={() => {
                    alert('FIR Submitted to Central Station');
                    setSelectedFir(null);
                  }}
                  className="flex-1 bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground font-semibold py-4 rounded-2xl hover:shadow-xl hover:shadow-destructive/20 transition-all duration-300 flex items-center justify-center gap-3 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Submit to Police Station
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
