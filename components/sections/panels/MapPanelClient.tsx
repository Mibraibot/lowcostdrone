"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polygon } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { useGateway } from "@/hooks/useGateway";
import { useTimeseries } from "@/hooks/useTimeseries";
import { useMap } from "react-leaflet";
import { isNodeConnected } from "@/utils/connection";
import { computeFleetCenter, computeNodesCenter } from "@/utils/geo";

// ===============================
// FIX DEFAULT LEAFLET ICON BUG
// ===============================
delete (L.Icon.Default.prototype as any)._getIconUrl;

// ===============================
// CSS ANIMATIONS
// ===============================
const pulseStyles = `
  @keyframes marker-pulse-safe {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
  }
  @keyframes marker-pulse-warning {
    0% { filter: drop-shadow(0 0 2px rgba(255, 191, 0, 0.7)); }
    50% { filter: drop-shadow(0 0 10px rgba(255, 191, 0, 0.9)); }
    100% { filter: drop-shadow(0 0 2px rgba(255, 191, 0, 0.7)); }
  }
  @keyframes marker-pulse-critical {
    0% { filter: drop-shadow(0 0 2px rgba(255, 0, 0, 0.8)); }
    50% { filter: drop-shadow(0 0 20px rgba(255, 0, 0, 1)); }
    100% { filter: drop-shadow(0 0 2px rgba(255, 0, 0, 0.8)); }
  }
  .marker-safe { animation: marker-pulse-safe 3s infinite ease-in-out; }
  .marker-warning { animation: marker-pulse-warning 1.5s infinite ease-in-out; }
  .marker-critical { animation: marker-pulse-critical 0.8s infinite ease-in-out; }
  
  @keyframes radar-pulse {
    0% { transform: scale(0.1); opacity: 1; }
    100% { transform: scale(3.5); opacity: 0; }
  }
  .radar-container {
    position: relative;
    width: 100px;
    height: 100px;
    margin-left: -50px;
    margin-top: -50px;
    pointer-events: none;
  }
  .radar-ring {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    border-radius: 50%;
    border: 3px solid;
    animation: radar-pulse 2.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
  }
  .radar-ring:nth-child(2) {
    animation-delay: 1.25s;
  }
  .radar-safe .radar-ring {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.15);
  }
  .radar-critical .radar-ring {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.15);
  }
`;

// ===============================
// MAP RECENTER HELPER
// ===============================
function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 19, { duration: 4, easeLinearity: 0.25 });
  }, [center, map]);
  return null;
}

// ===============================
// CUSTOM ICONS
// ===============================
const SHADOW_URL = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png";
const MARKER_BASE = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img";

const iconDefaults = {
  shadowUrl: SHADOW_URL,
  iconSize: [25, 41] as [number, number],
  iconAnchor: [12, 41] as [number, number],
  popupAnchor: [1, -34] as [number, number],
  shadowSize: [41, 41] as [number, number],
};

const gatewayIcon = L.icon({ ...iconDefaults, iconUrl: `${MARKER_BASE}/marker-icon-2x-blue.png` });
const nodeSafeIcon = L.icon({ ...iconDefaults, iconUrl: `${MARKER_BASE}/marker-icon-2x-green.png`, className: "marker-safe" });
const nodeCriticalIcon = L.icon({ ...iconDefaults, iconUrl: `${MARKER_BASE}/marker-icon-2x-red.png`, className: "marker-critical" });

// ===============================
// MAIN COMPONENT
// ===============================
export default function MapPanelClient() {
  const { gateway } = useGateway();
  const { latestDetections, now } = useTimeseries();

  const center: [number, number] =
    gateway && !isNaN(Number(gateway.lat)) && !isNaN(Number(gateway.lon))
      ? [Number(gateway.lat), Number(gateway.lon)]
      : [-6.9147, 107.6098];

  const isCritical = useMemo(() => {
   return Object.values(latestDetections).some((p) => p?.isDrone);
}, [latestDetections]);

  const nodesCenter = useMemo(() => {
    if (!gateway?.nodes) return center;
    return computeNodesCenter(gateway.nodes, center);
  }, [gateway, center]);

  const fleetCenter = useMemo(() => {
    return computeFleetCenter(center, gateway?.nodes);
  }, [gateway, center]);

  const radarIcon = useMemo(() => {
    return L.divIcon({
      className: "custom-radar-icon",
      html: `<div class="radar-container radar-${isCritical ? "critical" : "safe"}">
               <div class="radar-ring"></div>
               <div class="radar-ring"></div>
             </div>`,
      iconSize: [0, 0],
    });
  }, [isCritical]);

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden border border-slate-800">
      <style dangerouslySetInnerHTML={{ __html: pulseStyles }} />
      <div
        className="absolute top-3 left-3 z-[1000]
          bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30
          text-[10px] font-bold text-cyan-400 tracking-widest uppercase"
      >
        Live Deployment Monitor
      </div>

      <MapContainer
        center={[-2.5489, 118.0149]}
        zoom={4}
        maxZoom={24}
        scrollWheelZoom
        className="h-full w-full"
      >
        {gateway && <MapRecenter center={fleetCenter} />}

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; CARTO"
          maxNativeZoom={20}
          maxZoom={24}
        />

        {gateway && (
          <>
            {/* PERIMETER POLYGON */}
            {gateway.nodes && (
              <Polygon
                positions={Object.values(gateway.nodes)
                  .map((n) => [Number(n.lat), Number(n.lon)] as [number, number])
                  .filter((pos) => !isNaN(pos[0]) && !isNaN(pos[1]))}
                pathOptions={{
                  color: "#22d3ee",
                  weight: 2,
                  dashArray: "5, 10",
                  fillColor: "white",
                  fillOpacity: 0.1,
                }}
              />
            )}

            {/* GATEWAY MARKER */}
            <Marker position={center} icon={gatewayIcon}>
              <Popup className="custom-popup">
                <div className="text-slate-900 font-bold">Main Gateway</div>
                <div className="text-slate-600 text-xs">
                  {center[0].toFixed(4)}, {center[1].toFixed(4)}
                </div>
              </Popup>
            </Marker>

            {/* RADAR EFFECT */}
            <Marker position={nodesCenter} icon={radarIcon} interactive={false} zIndexOffset={-100} />

            {/* NODE MARKERS */}
            {gateway.nodes &&
              Object.entries(gateway.nodes).map(([nodeKey, coords]) => {
                const lat = Number(coords.lat);
                const lon = Number(coords.lon);
                if (isNaN(lat) || isNaN(lon)) return null;

                const position: [number, number] = [lat, lon];
                const det = latestDetections[nodeKey];
                const label = det?.detection_label || "Waiting for Live Data...";
                const isDrone = det?.isDrone || false;
                const connected = isNodeConnected(det?.timestamp, now);
                const currentIcon = isDrone ? nodeCriticalIcon : nodeSafeIcon;

                return (
                  <Marker key={nodeKey} position={position} icon={currentIcon}>
                    <Popup>
                      <div className="font-bold text-slate-800 uppercase">{nodeKey}</div>
                      <div className={`text-xs ${isDrone ? "text-red-500 font-bold animate-pulse" : "text-slate-500"}`}>
                        Status: {label}
                        <br />
                        <span className={connected ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                          {connected ? "Connected" : "Disconnected"}
                        </span>
                        <br />
                        Pos: {lat.toFixed(4)}, {lon.toFixed(4)}
                        {det && (
                          <div className="mt-1 text-[10px] text-cyan-600 font-medium">
                            (Live: {new Date(det.timestamp).toLocaleTimeString()})
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
          </>
        )}
      </MapContainer>
    </div>
  );
}
