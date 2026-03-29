"use client"

import { useEffect } from "react"
import type { DashboardTourist } from "@/lib/dashboard-types"
import { getTouristSignalMeta } from "@/lib/signal-status"
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import "leaflet.heat"

type HeatLayerFactory = typeof L & {
  heatLayer?: (
    points: [number, number, number][],
    options: {
      radius: number
      blur: number
      maxZoom: number
      gradient: Record<number, string>
    }
  ) => L.Layer
}

const normalIcon = L.divIcon({
  className: "custom-div-icon",
  html: "<div style='background-color:#0ea5e9;width:1.2rem;height:1.2rem;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5);'></div>",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

const dangerIcon = L.divIcon({
  className: "custom-div-icon",
  html: "<div style='background-color:#ef4444;width:1.2rem;height:1.2rem;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5);'></div>",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

const staleIcon = L.divIcon({
  className: "custom-div-icon",
  html: "<div style='background-color:#64748b;width:1.2rem;height:1.2rem;border-radius:50%;border:2px solid rgba(255,255,255,0.9);opacity:0.65;box-shadow:0 0 4px rgba(0,0,0,0.35);'></div>",
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

const HEATMAP_POINTS: [number, number, number][] = [
  [28.6181, 77.2051, 1],
  [28.618, 77.2052, 0.8],
  [28.6179, 77.2048, 0.9],
  [28.6182, 77.2055, 0.7],
  [28.6175, 77.205, 0.6],
  [28.6178, 77.2058, 0.9],
  [28.6185, 77.2045, 0.8],
  [28.6188, 77.204, 0.5],
  [28.6172, 77.206, 0.7],
  [28.618, 77.205, 1],
  [28.6181, 77.2054, 0.9],
  [28.6177, 77.2051, 0.8],
  [28.615, 77.201, 0.6],
  [28.6152, 77.2015, 0.8],
  [28.6148, 77.2012, 0.5],
  [28.6145, 77.2018, 0.7],
]

type TouristWithLocation = DashboardTourist & {
  currentLocation: {
    lat: number
    lng: number
  }
}

function hasValidCurrentLocation(tourist: DashboardTourist): tourist is TouristWithLocation {
  return typeof tourist?.currentLocation?.lat === "number"
    && Number.isFinite(tourist.currentLocation.lat)
    && typeof tourist?.currentLocation?.lng === "number"
    && Number.isFinite(tourist.currentLocation.lng)
}

function getMarkerIcon(tourist: DashboardTourist, nowMs: number) {
  const signal = getTouristSignalMeta(tourist, nowMs)
  if (signal.isStale) {
    return staleIcon
  }

  const safetyScore = typeof tourist?.safetyScore === "number" && Number.isFinite(tourist.safetyScore)
    ? tourist.safetyScore
    : 100

  return safetyScore < 80 ? dangerIcon : normalIcon
}

function HeatmapLayer({ tourists, nowMs }: { tourists: DashboardTourist[]; nowMs: number }) {
  const map = useMap()
  const leafletWithHeat = L as HeatLayerFactory

  useEffect(() => {
    const safeTourists = tourists
      .filter(hasValidCurrentLocation)
      .filter((tourist) => !getTouristSignalMeta(tourist, nowMs).isStale)

    if (typeof window !== "undefined" && leafletWithHeat.heatLayer) {
      const liveTouristPoints: [number, number, number][] = safeTourists.map((tourist) => [
        tourist.currentLocation.lat,
        tourist.currentLocation.lng,
        tourist.status === "Panic" ? 1 : 0.5,
      ])

      const points: [number, number, number][] = [
        ...HEATMAP_POINTS,
        ...liveTouristPoints,
      ]

      if (points.length === 0) {
        return
      }

      const heat = leafletWithHeat.heatLayer(points, {
        radius: 35,
        blur: 25,
        maxZoom: 15,
        gradient: { 0.4: "cyan", 0.6: "yellow", 0.8: "orange", 1.0: "red" },
      }).addTo(map)

      return () => {
        map.removeLayer(heat)
      }
    }
  }, [leafletWithHeat, map, nowMs, tourists])

  return null
}

export default function MapClient({ tourists, nowMs }: { tourists: DashboardTourist[]; nowMs: number }) {
  const safeTourists = Array.isArray(tourists) ? tourists.filter(hasValidCurrentLocation) : []

  return (
    <MapContainer center={[28.6139, 77.209] as [number, number]} zoom={14} style={{ height: "100%", width: "100%" }} className="z-0">
      <TileLayer
        attribution="&copy; CARTO"
        url="https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />

      <Circle
        center={[28.6562, 77.241] as [number, number]}
        pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.1, weight: 2, dashArray: "4" }}
        radius={500}
      />

      <HeatmapLayer tourists={safeTourists} nowMs={nowMs} />

      {safeTourists.map((tourist, index) => {
        const touristName = typeof tourist?.name === "string" && tourist.name.trim() ? tourist.name : "Unknown Tourist"
        const touristId = typeof tourist?.blockchainId === "string" && tourist.blockchainId.trim()
          ? tourist.blockchainId
          : `tourist-${index}`
        const safetyScore = typeof tourist?.safetyScore === "number" && Number.isFinite(tourist.safetyScore)
          ? tourist.safetyScore
          : 100
        const status = typeof tourist?.status === "string" && tourist.status.trim() ? tourist.status : "Active"
        const signal = getTouristSignalMeta(tourist, nowMs)

        return (
          <Marker
            key={touristId}
            position={[tourist.currentLocation.lat, tourist.currentLocation.lng]}
            icon={getMarkerIcon(tourist, nowMs)}
            opacity={signal.isStale ? 0.7 : 1}
          >
            <Popup>
              <div className="min-w-[190px] p-1">
                <div className="mb-1 border-b pb-1 font-bold">{touristName}</div>
                <div className="break-all text-[10px] font-mono text-muted-foreground">{touristId}</div>
                <div className="mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                  <span className={signal.isStale ? "text-slate-600" : "text-emerald-600"}>
                    {signal.badgeLabel}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Trip:</span>
                    <span className="font-bold">{tourist.tripId || "DEFAULT"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Status:</span>
                    <span className={`font-bold ${status === "Panic" ? "text-red-500" : status === "Warning" ? "text-yellow-600" : "text-green-600"}`}>
                      {status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Safety:</span>
                    <span className="font-bold" style={{ color: safetyScore < 80 ? "#ef4444" : "#22c55e" }}>
                      {safetyScore}/100
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-xs">
                    <span>Last Ping:</span>
                    <span className={`text-right font-medium ${signal.isStale ? "text-slate-600" : "text-emerald-700"}`}>
                      {signal.detailLabel}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">{signal.lastPingLabel}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
