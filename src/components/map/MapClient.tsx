"use client"
import { useEffect } from "react"
import type { DashboardTourist } from "@/lib/dashboard-types"
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import "leaflet.heat"

type HeatLayerFactory = typeof L & {
  heatLayer?: (
    points: [number, number, number][],
    options: {
      radius: number;
      blur: number;
      maxZoom: number;
      gradient: Record<number, string>;
    }
  ) => L.Layer;
}

const normalIcon = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#0ea5e9;width:1.2rem;height:1.2rem;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5);'></div>",
  iconSize: [20, 20],
  iconAnchor: [10, 10]
})

const dangerIcon = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#ef4444;width:1.2rem;height:1.2rem;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5);'></div>",
  iconSize: [20, 20],
  iconAnchor: [10, 10]
})

// Hardcoded historical incident data tightly clustered around the Risk Zone center
const HEATMAP_POINTS: [number, number, number][] = [
  // Primary Risk Cluster
  [28.6181, 77.2051, 1], [28.6180, 77.2052, 0.8], [28.6179, 77.2048, 0.9],
  [28.6182, 77.2055, 0.7], [28.6175, 77.2050, 0.6], [28.6178, 77.2058, 0.9],
  [28.6185, 77.2045, 0.8], [28.6188, 77.2040, 0.5], [28.6172, 77.2060, 0.7],
  [28.6180, 77.2050, 1], [28.6181, 77.2054, 0.9], [28.6177, 77.2051, 0.8],
  
  // Secondary Smaller Cluster Outskirts
  [28.6150, 77.2010, 0.6], [28.6152, 77.2015, 0.8], [28.6148, 77.2012, 0.5],
  [28.6145, 77.2018, 0.7]
];

function hasValidCurrentLocation(tourist: DashboardTourist) {
  return typeof tourist?.currentLocation?.lat === "number"
    && Number.isFinite(tourist.currentLocation.lat)
    && typeof tourist?.currentLocation?.lng === "number"
    && Number.isFinite(tourist.currentLocation.lng)
}

function HeatmapLayer({ tourists }: { tourists: DashboardTourist[] }) {
  const map = useMap();
  const leafletWithHeat = L as HeatLayerFactory;

  useEffect(() => {
    const safeTourists = tourists.filter(hasValidCurrentLocation)

    // Only execute on client-side and ensure leaflet.heat is attached
    if (typeof window !== 'undefined' && leafletWithHeat.heatLayer) {
      const liveTouristPoints: [number, number, number][] = safeTourists.map((tourist) => [
        tourist.currentLocation.lat,
        tourist.currentLocation.lng,
        tourist.status === 'Panic' ? 1 : 0.5
      ] as [number, number, number])

      const points: [number, number, number][] = [
        ...HEATMAP_POINTS,
        ...liveTouristPoints,
      ];

      if (points.length === 0) {
        return;
      }

      const heat = leafletWithHeat.heatLayer(points, {
        radius: 35,
        blur: 25,
        maxZoom: 15,
        gradient: { 0.4: 'cyan', 0.6: 'yellow', 0.8: 'orange', 1.0: 'red' }
      }).addTo(map);

      return () => {
        map.removeLayer(heat);
      };
    }
  }, [leafletWithHeat, map, tourists]);
  return null;
}

export default function MapClient({ tourists }: { tourists: DashboardTourist[] }) {
  const safeTourists = Array.isArray(tourists) ? tourists.filter(hasValidCurrentLocation) : []

  return (
    <MapContainer center={[28.6139, 77.2090] as [number, number]} zoom={14} style={{ height: "100%", width: "100%" }} className="z-0">
      <TileLayer
        attribution='&copy; CARTO'
        url="https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      
      <Circle 
        center={[28.6562, 77.2410]} 
        pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.1, weight: 2, dashArray: '4' }} 
        radius={500} 
      />
      
      <HeatmapLayer tourists={safeTourists} />
      
      {safeTourists.map((u, index) => {
        const touristName = typeof u?.name === "string" && u.name.trim() ? u.name : "Unknown Tourist"
        const touristId = typeof u?.blockchainId === "string" && u.blockchainId.trim() ? u.blockchainId : `tourist-${index}`
        const safetyScore = typeof u?.safetyScore === "number" && Number.isFinite(u.safetyScore) ? u.safetyScore : 100
        const status = typeof u?.status === "string" && u.status.trim() ? u.status : "Active"

        return (
          <Marker 
            key={touristId} 
            position={[u.currentLocation.lat, u.currentLocation.lng]} 
            icon={safetyScore < 80 ? dangerIcon : normalIcon}
          >
            <Popup>
              <div className="p-1 min-w-[150px]">
                <div className="font-bold border-b pb-1 mb-1">{touristName}</div>
                <div className="text-[10px] font-mono text-muted-foreground break-all">{touristId}</div>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Status:</span>
                    <span className={`font-bold ${status === 'Panic' ? 'text-red-500' : (status === 'Warning' ? 'text-yellow-600' : 'text-green-600')}`}>
                      {status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Safety:</span>
                    <span className="font-bold" style={{ color: safetyScore < 80 ? "#ef4444" : "#22c55e" }}>
                      {safetyScore}/100
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
