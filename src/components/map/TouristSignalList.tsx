"use client"

import { Activity, WifiOff } from "lucide-react"
import type { DashboardTourist } from "@/lib/dashboard-types"
import { Badge } from "@/components/ui/badge"
import { compareTouristsBySignal, getTouristSignalMeta } from "@/lib/signal-status"

export function TouristSignalList({ tourists, nowMs }: { tourists: DashboardTourist[]; nowMs: number }) {
  const sortedTourists = [...tourists].sort((left, right) => compareTouristsBySignal(left, right, nowMs))

  if (sortedTourists.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-muted/10 px-4 py-5 text-sm text-muted-foreground">
        No tourists are currently assigned to this view.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sortedTourists.map((tourist) => {
        const signal = getTouristSignalMeta(tourist, nowMs)
        const touristName = tourist.name?.trim() ? tourist.name : "Unknown Tourist"

        return (
          <div
            key={tourist.blockchainId}
            className={`rounded-xl border px-4 py-3 transition-colors ${
              signal.isStale
                ? "border-slate-400/30 bg-slate-500/5"
                : "border-emerald-500/20 bg-emerald-500/5"
            }`}
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{touristName}</p>
                  <Badge
                    variant={signal.isStale ? "outline" : "secondary"}
                    className={signal.isStale ? "border-slate-400/40 text-slate-600" : "bg-emerald-500/10 text-emerald-700"}
                  >
                    {signal.isStale ? <WifiOff className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
                    {signal.badgeLabel}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {tourist.tripId || "DEFAULT"} - {tourist.blockchainId}
                </p>
              </div>

              <div className="text-left text-xs text-muted-foreground md:text-right">
                <p>{signal.detailLabel}</p>
                <p>{signal.lastPingLabel}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
