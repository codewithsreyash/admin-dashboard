"use client"
import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { MapPin } from "lucide-react"

// Fix for leaflet default icons in nextjs
const customIcon = L.divIcon({
  className: 'custom-div-icon',
  html: "<div style='background-color:#ef4444;width:1rem;height:1rem;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5);'></div>",
  iconSize: [20, 20],
  iconAnchor: [10, 10]
})

const DUMMY_MARKERS = [
  { id: 1, lat: 28.6139, lng: 77.2090, name: "Tourist #A31Z", status: "Active", score: 98 },
  { id: 2, lat: 28.6145, lng: 77.2021, name: "Tourist #B92Y", status: "Idle Warning", score: 65 },
  { id: 3, lat: 28.6110, lng: 77.2150, name: "Tourist #C11X", status: "Active", score: 88 },
  { id: 4, lat: 28.6105, lng: 77.2100, name: "Tourist #D44E (Panic)", status: "Panic", score: 20 },
]

export default function MapClient() {
  return (
    <MapContainer 
      center={[28.6139, 77.2090] as [number, number]} 
      zoom={14} 
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      
      {/* High-Risk Polygon (Mocked as Circle) */}
      <Circle 
        center={[28.6105, 77.2100]} 
        pathOptions={{ color: 'red', fillColor: '#ef4444', fillOpacity: 0.2 }} 
        radius={400} 
      />

      {DUMMY_MARKERS.map((marker) => (
        <Marker 
          key={marker.id} 
          position={[marker.lat, marker.lng]} 
          icon={customIcon}
        >
          <Popup>
            <div className="p-1">
              <strong className="text-gray-900">{marker.name}</strong><br/>
              <span className="text-gray-600 text-xs">Status: {marker.status}</span><br/>
              <span className="text-gray-600 text-xs">Safety Score: {marker.score}</span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
