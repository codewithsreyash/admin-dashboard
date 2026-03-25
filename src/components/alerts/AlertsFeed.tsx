"use client"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BellRing, ShieldAlert, NavigationOff, Search } from "lucide-react"

const ALERTS = [
  { id: 1, type: "Panic", message: "Panic Button Pressed - Tourist #D44E", time: "Just now", severity: "high" },
  { id: 2, type: "Geo-Fence", message: "Tourist #B92Y entered Red Zone", time: "2 min ago", severity: "medium" },
  { id: 3, type: "No-Movement", message: "Tourist #M21A idle for > 30 mins", time: "10 min ago", severity: "low" },
  { id: 4, type: "System", message: "Blockchain ID verification failure", time: "1 hr ago", severity: "low" },
]

export function AlertsFeed() {
  return (
    <Card className="h-full border-destructive/20 shadow-xl overflow-hidden flex flex-col">
      <CardHeader className="bg-destructive/10 pb-4 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BellRing className="h-5 w-5 text-destructive animate-pulse" />
            Active Alerts Feed
          </CardTitle>
          <Badge variant="destructive" className="animate-pulse">3 New</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-0">
        <div className="divide-y divide-border/50">
          {ALERTS.map((alert) => (
            <div key={alert.id} className="p-4 hover:bg-muted/50 transition-colors flex gap-4">
              <div className="mt-1">
                {alert.type === "Panic" && <ShieldAlert className="h-5 w-5 text-destructive" />}
                {alert.type === "Geo-Fence" && <NavigationOff className="h-5 w-5 text-orange-500" />}
                {alert.type === "No-Movement" && <Search className="h-5 w-5 text-yellow-500" />}
                {alert.type === "System" && <BellRing className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">{alert.message}</p>
                <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                  <span>{alert.type}</span>
                  <span>{alert.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
