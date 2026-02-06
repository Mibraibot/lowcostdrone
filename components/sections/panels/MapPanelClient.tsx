"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ===============================
// FIX DEFAULT LEAFLET ICON BUG
// ===============================
delete (L.Icon.Default.prototype as any)._getIconUrl;

// ===============================
// CUSTOM ICON
// ===============================
const homeBaseIcon = L.icon({
  iconUrl: "/icons/home-base.svg",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// ===============================
// COORDINATE
// ===============================
const center: [number, number] = [-6.2, 106.8166];

export default function MapPanelClient() {
  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden">

      {/* Overlay Title */}
      <div className="absolute top-3 left-3 z-[1000]
        bg-black/60 backdrop-blur px-3 py-1 rounded
        text-xs text-cyan-300 tracking-wider">
        LIVE DRONE MONITORING
      </div>

      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom
        className="
          h-full w-full
          rounded-xl
          border border-cyan-500/20
          shadow-[0_0_24px_rgba(0,229,255,0.12)]
        "
      >
        {/* DARK MAP TILE */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; CARTO"
        />

        {/* ===============================
            DETECTION RADIUS
        =============================== */}
        <Circle
          center={center}
          radius={3000}
          pathOptions={{
            color: "#00e5ff",
            fillColor: "#00e5ff",
            fillOpacity: 0.12,
            weight: 1,
            dashArray: "6 6",
          }}
        />

        {/* ===============================
            HOME BASE MARKER
        =============================== */}
    
      </MapContainer>
    </div>
  );
}
