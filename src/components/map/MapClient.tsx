"use client"
import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import "leaflet.heat"

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

function HeatmapLayer({ tourists }: { tourists: any[] }) {
  const map = useMap();
  useEffect(() => {
    // Only execute on client-side and ensure leaflet.heat is attached
    if (typeof window !== 'undefined' && (L as any).heatLayer) {
      const points: [number, number, number][] = tourists.map(t => [
        t.currentLocation.lat,
        t.currentLocation.lng,
        t.status === 'Panic' ? 1 : 0.5
      ]);

      const heat = (L as any).heatLayer(points, {
        radius: 35,
        blur: 25,
        maxZoom: 15,
        gradient: { 0.4: 'cyan', 0.6: 'yellow', 0.8: 'orange', 1.0: 'red' }
      }).addTo(map);

      return () => {
        map.removeLayer(heat);
      };
    }
  }, [map, tourists]);
  return null;
}

export default function MapClient({ tourists }: { tourists: any[] }) {
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
      
      <HeatmapLayer tourists={tourists} />
      
      {tourists.map((u) => (
        <Marker 
          key={u.blockchainId} 
          position={[u.currentLocation.lat, u.currentLocation.lng]} 
          icon={u.safetyScore < 80 ? dangerIcon : normalIcon}
        >
          <Popup>
            <div className="p-1 min-w-[150px]">
              <div className="font-bold border-b pb-1 mb-1">{u.name}</div>
              <div className="text-[10px] font-mono text-muted-foreground break-all">{u.blockchainId}</div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Status:</span>
                  <span className={`font-bold ${u.status === 'Panic' ? 'text-red-500' : (u.status === 'Warning' ? 'text-yellow-600' : 'text-green-600')}`}>
                    {u.status}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Safety:</span>
                  <span className="font-bold" style={{ color: u.safetyScore < 80 ? "#ef4444" : "#22c55e" }}>
                    {u.safetyScore}/100
                  </span>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

