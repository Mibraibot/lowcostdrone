"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ===============================
// FIX DEFAULT LEAFLET ICON BUG
// ===============================
delete (L.Icon.Default.prototype as any)._getIconUrl;

// Add pulsing animations via CSS
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
    border-color: #10b981; /* emerald-500 */
    background: rgba(16, 185, 129, 0.15);
  }
  .radar-critical .radar-ring {
    border-color: #ef4444; /* red-500 */
    background: rgba(239, 68, 68, 0.15);
  }
`;

import { useGateway } from "@/hooks/useGateway";
import { useRealtimeNodes } from "@/hooks/useRealtimeNodes";
import { usePredictionSocket } from "@/hooks/usePredictionSocket";
import { useMap } from "react-leaflet";

// Component to handle auto-centering when gateway loads
function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 19, {
      duration: 4, // 4 detik animasi cinematic
      easeLinearity: 0.25
    });
  }, [center, map]);
  return null;
}

// ===============================
// CUSTOM ICONS
// ===============================
const gatewayIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const nodeSafeIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "marker-safe"
});

const nodeWarningIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "marker-warning"
});

const nodeCriticalIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "marker-critical"
});

export default function MapPanelClient() {
  const { gateway } = useGateway();
  const { nodes } = useRealtimeNodes();
  const { latestPredictions } = usePredictionSocket();

  const center: [number, number] = (gateway && !isNaN(Number(gateway.lat)) && !isNaN(Number(gateway.lon)))
    ? [Number(gateway.lat), Number(gateway.lon)] 
    : [-6.9147, 107.6098]; // Fallback to default center

  const isCritical = useMemo(() => {
    let critical = false;
    if (latestPredictions) {
      Object.values(latestPredictions).forEach((pred) => {
        if (pred?.prediction_id === 3) critical = true;
      });
    }
    return critical;
  }, [latestPredictions]);

  const nodesCenter = useMemo(() => {
    if (!gateway?.nodes) return center;
    let sumLat = 0;
    let sumLon = 0;
    let count = 0;
    Object.values(gateway.nodes).forEach((node: any) => {
      const lat = Number(node.lat);
      const lon = Number(node.lon);
      if (!isNaN(lat) && !isNaN(lon)) {
        sumLat += lat;
        sumLon += lon;
        count++;
      }
    });
    if (count === 0) return center;
    return [sumLat / count, sumLon / count] as [number, number];
  }, [gateway, center]);

  const radarIcon = useMemo(() => {
    return L.divIcon({
      className: 'custom-radar-icon',
      html: `<div class="radar-container radar-${isCritical ? 'critical' : 'safe'}">
               <div class="radar-ring"></div>
               <div class="radar-ring"></div>
             </div>`,
      iconSize: [0, 0],
    });
  }, [isCritical]);

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden border border-slate-800">
      <style dangerouslySetInnerHTML={{ __html: pulseStyles }} />
      <div className="absolute top-3 left-3 z-[1000]
        bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30
        text-[10px] font-bold text-cyan-400 tracking-widest uppercase">
        Live Deployment Monitor
      </div>

      <MapContainer
        center={[-2.5489, 118.0149]}
        zoom={4}
        maxZoom={24}
        scrollWheelZoom
        className="h-full w-full"
      >
        {gateway && <MapRecenter center={center} />}
        
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution="&copy; CARTO"
          maxNativeZoom={20}
          maxZoom={24}
        />

        {gateway && (
          <>
            {/* PERIMETER POLYGON (Node 1 -> 2 -> 3) */}
            {gateway.nodes && (
              <Polygon
                positions={[
                  [Number(gateway.nodes.node1?.lat), Number(gateway.nodes.node1?.lon)],
                  [Number(gateway.nodes.node2?.lat), Number(gateway.nodes.node2?.lon)],
                  [Number(gateway.nodes.node3?.lat), Number(gateway.nodes.node3?.lon)],
                ].filter(pos => !isNaN(pos[0]) && !isNaN(pos[1])) as [number, number][]}
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
                <div className="text-slate-600 text-xs">{center[0].toFixed(4)}, {center[1].toFixed(4)}</div>
              </Popup>
            </Marker>

            {/* RADAR EFFECT ON NODES CENTER */}
            <Marker position={nodesCenter} icon={radarIcon} interactive={false} zIndexOffset={-100} />

            {/* NODE MARKERS */}
            {gateway.nodes && Object.entries(gateway.nodes).map(([nodeKey, coords]) => {
              const nodeData = nodes[nodeKey];
              const livePrediction = latestPredictions[nodeKey];
              
              const lat = Number(coords.lat);
              const lon = Number(coords.lon);

              if (isNaN(lat) || isNaN(lon)) return null;

              const position: [number, number] = [lat, lon];
              const label = livePrediction?.prediction_label || "Waiting for Live Data...";
              const predId = livePrediction?.prediction_id || 1;
              const isDrone = predId === 3;

              // Select icon based on prediction ID
              const currentIcon = predId === 3 ? nodeCriticalIcon : predId === 2 ? nodeWarningIcon : nodeSafeIcon;

              return (
                <Marker 
                  key={nodeKey} 
                  position={position} 
                  icon={currentIcon}
                >
                  <Popup>
                    <div className="font-bold text-slate-800 uppercase">{nodeKey}</div>
                    <div className={`text-xs ${isDrone ? 'text-red-500 font-bold animate-pulse' : 'text-slate-500'}`}>
                      Status: {label}<br/>
                      {(() => {
                        let isConnected = false;
                        if (nodeData?.captured_at) {
                          const capturedTime = new Date(nodeData.captured_at.replace(" ", "T")).getTime();
                          if (!isNaN(capturedTime) && (Date.now() - capturedTime) < 2 * 60 * 1000) {
                            isConnected = true;
                          }
                        }
                        return (
                          <span className={isConnected ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                            {isConnected ? "Connected" : "Disconnected"}
                          </span>
                        );
                      })()}<br/>
                      Pos: {lat.toFixed(4)}, {lon.toFixed(4)}
                      {livePrediction && (
                        <div className="mt-1 text-[10px] text-cyan-600 font-medium">
                          (Live via Socket: {new Date(livePrediction.timestamp).toLocaleTimeString()})
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
