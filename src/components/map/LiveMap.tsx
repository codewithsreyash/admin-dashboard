"use client"
import dynamic from "next/dynamic"
import type { DashboardTourist } from "@/lib/dashboard-types"

const Map = dynamic(
  () => import('./MapClient'),
  { 
    ssr: false,
    loading: () => <div className="flex h-full w-full items-center justify-center bg-muted/20 text-muted-foreground">Loading Map Data...</div>
  }
)

export function LiveMap({ tourists }: { tourists: DashboardTourist[] }) {
  return (
    <div className="h-[500px] w-full overflow-hidden rounded-xl border shadow-sm">
      <Map tourists={tourists} />
    </div>
  )
}
