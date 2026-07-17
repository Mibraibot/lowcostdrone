"use client";

import {
  Wifi,
  BatteryFull,
  MapPin,
  Signal,
  Shield,
  AlertTriangle,
  AlertOctagon,
} from "lucide-react";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";

/* ------------------------------ UTIL & HOOKS ------------------------------ */

// Cache sederhana di memory halaman
const geocodeCache = new Map<string, string>();

// Debounce helper untuk mencegah spam request saat mouse jitter
function useDebouncedCallback<T extends (...args: unknown[]) => void>(
  fn: T,
  delay = 250
) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (...args: Parameters<T>) => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => fn(...(args as Parameters<T>)), delay);
  };
}

// Reverse geocoding via Nominatim (OpenStreetMap)
// NOTE: Untuk produksi, pertimbangkan lewat server (proxy) + header User-Agent.
async function reverseGeocode(lat: number | string, lon: number | string): Promise<string> {
  const numLat = Number(lat) || 0;
  const numLon = Number(lon) || 0;
  const key = `${numLat.toFixed(6)},${numLon.toFixed(6)}`;
  if (geocodeCache.has(key)) return geocodeCache.get(key)!;

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(numLat));
  url.searchParams.set("lon", String(numLon));
  url.searchParams.set("zoom", "14");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), { method: "GET" });
  if (!res.ok) throw new Error(`Reverse geocode failed: ${res.status}`);

  const data = await res.json();
  const addr =
    data?.display_name ||
    [
      data?.address?.city,
      data?.address?.town,
      data?.address?.village,
      data?.address?.state,
      data?.address?.country_code?.toUpperCase(),
    ]
      .filter(Boolean)
      .join(", ") ||
    "Alamat tidak ditemukan";

  geocodeCache.set(key, addr);
  return addr;
}

// Hook: panggil reverse geocode on-demand saat hover masuk
function useReverseGeocodeOnHover(lat: number, lon: number) {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const trigger = useDebouncedCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const result = await reverseGeocode(lat, lon);
      setAddress(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal mengambil alamat";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }, 200);

  const reset = () => {
    // tetap pertahankan hasil agar tooltip cepat muncul berikutnya
    setErr(null);
  };

  return { address, loading, err, trigger, reset };
}

/* ------------------------------ UI: TOOLTIP (PORTAL) ---------------------- */

/** Tooltip yang dirender di document.body agar tidak terpotong parent overflow */
function TooltipPortal({
  open,
  anchorEl,
  children,
  offset = 8,
}: {
  open: boolean;
  anchorEl: HTMLElement | null;
  children: React.ReactNode;
  offset?: number;
}) {
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // Gunakan state untuk container portal agar tidak membaca ref saat render
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  );

  // Buat node container untuk portal (sekali saja)
  useEffect(() => {
    const el = document.createElement("div");
    el.setAttribute("data-portal", "latlon-tooltip");
    document.body.appendChild(el);

    return () => {
      document.body.removeChild(el);
      setPortalContainer(null);
    };
  }, []);

  // Posisi ulang tooltip saat open/scroll/resize
  useLayoutEffect(() => {
  if (!open) return;

  function place() {
    const anchor = anchorEl;
    const tt = tooltipRef.current;
    if (!anchor || !tt) return;

    const a = anchor.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Default: di atas tengah anchor
    const prefX = a.left + a.width / 2;
    const prefY = a.top - offset;

    // Siapkan untuk ukur ukuran tooltip
    tt.style.visibility = "hidden";
    tt.style.left = "0px";
    tt.style.top = "0px";
    tt.style.maxWidth = "280px";
    tt.style.position = "fixed";
    tt.style.pointerEvents = "none";
    tt.style.zIndex = "9999";

    const { width: tw, height: th } = tt.getBoundingClientRect();

    let left = Math.round(prefX - tw / 2);
    let top = Math.round(prefY - th);

    // Flip ke bawah jika tidak cukup ruang di atas
    const hasRoomTop = a.top >= th + offset + 8;
    if (!hasRoomTop) {
      top = Math.round(a.bottom + offset);
    }

    // Clamp horizontal
    const margin = 8;
    left = Math.min(Math.max(margin, left), vw - tw - margin);

    // Clamp vertical
    if (top + th + margin > vh) {
      top = Math.round(a.top - th - offset);
    }
    if (top < margin) top = margin;

    tt.style.left = `${left}px`;
    tt.style.top = `${top}px`;
    tt.style.visibility = "visible";
  }

  place();

  const onScroll = () => place();
  const onResize = () => place();

  window.addEventListener("scroll", onScroll, true);
  window.addEventListener("resize", onResize);

  let ro: ResizeObserver | null = null;
  if (anchorEl && "ResizeObserver" in window) {
    ro = new ResizeObserver(place);
    ro.observe(anchorEl);
  }

  return () => {
    window.removeEventListener("scroll", onScroll, true);
    window.removeEventListener("resize", onResize);
    if (ro) ro.disconnect();
  };
}, [open, anchorEl, offset]);


  if (!open || !portalContainer) return null;

  return createPortal(
    <div
      ref={tooltipRef}
      className={
        "rounded-md border border-slate-700 bg-slate-900/95 px-2 py-1 " +
        "shadow-lg shadow-black/40 backdrop-blur text-[10px] text-slate-200 " +
        "whitespace-pre-line max-w-[280px] pointer-events-none"
      }
      role="tooltip"
    >
      {children}
    </div>,
    portalContainer
  );
}

/* ------ Komponen kecil untuk lat/lon yang bisa di-hover (pakai Portal) ---- */

function HoverableLatLon({
  lat,
  lon,
  inline = true,
  labelPrefix,
}: {
  lat: number | string;
  lon: number | string;
  inline?: boolean;
  labelPrefix?: string;
}) {
  const [open, setOpen] = useState(false);
  const { address, loading, err, trigger, reset } = useReverseGeocodeOnHover(
    Number(lat) || 0,
    Number(lon) || 0
  );
  const fmt = useMemo(() => {
    const nLat = Number(lat) || 0;
    const nLon = Number(lon) || 0;
    return `${nLat.toFixed(4)}, ${nLon.toFixed(4)}`;
  }, [lat, lon]);

  // Hindari membaca ref.current saat render: gunakan callback ref ke state
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <>
      <span
        ref={setAnchorEl}
        className={
          "relative group cursor-help text-slate-300 hover:text-emerald-300 transition-colors " +
          (inline ? "inline-block" : "block")
        }
        onMouseEnter={() => {
          setOpen(true);
          trigger();
        }}
        onMouseLeave={() => {
          setOpen(false);
          reset();
        }}
        title={address || `Lat, Lon: ${fmt}`}
        aria-label={`Koordinat ${fmt}`}
      >
        {labelPrefix ? `${labelPrefix} ` : null}
        {fmt}
      </span>

      <TooltipPortal open={open} anchorEl={anchorEl}>
        <div className="flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 mt-[1px]" />
          <div className="space-y-0.5">
            <div className="text-[9px] uppercase tracking-wider text-slate-400">
              Koordinat
            </div>
            <div className="font-mono text-slate-100 font-semibold">{fmt}</div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 mt-1">
              Alamat
            </div>
            <div className="text-slate-200">
              {loading && "Memuat alamat…"}
              {!loading && err && (
                <span className="text-red-300">Gagal memuat alamat</span>
              )}
              {!loading && !err && (address || "Alamat tidak ditemukan")}
            </div>
          </div>
        </div>
      </TooltipPortal>
    </>
  );
}

/* ------------------------------ MAIN WIDGET ------------------------------- */

type RfStatus = "safe" | "warning" | "critical";

import { useFirebasePredictions } from "@/hooks/useFirebasePredictions";
import { usePredictionSocket } from "@/hooks/usePredictionSocket";
import { useGateway } from "@/hooks/useGateway";

export default function DashboardStats() {
  const [mounted, setMounted] = useState(false);
  const { nodes, predictions } = useFirebasePredictions();
  const { latestPredictions } = usePredictionSocket();
  const { gateway } = useGateway();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  // Determine global RF status based on latest predictions
  const { rfStatus, detectedSignals } = useMemo(() => {
    let critical = false;
    let signals = 0;

    // Check all nodes from Firebase
    Object.keys(nodes).forEach(nodeKey => {
      // Prioritas: hasil deteksi backend dari Firebase, fallback socket lama
      const fbPred = predictions[nodeKey];
      const socketPred = latestPredictions[nodeKey];
      if (fbPred ? fbPred.is_drone : socketPred?.prediction_id === 3) {
        critical = true;
      }

      // Simulate signal count based on RSSI if available
      const nodeData = nodes[nodeKey];
      if (nodeData?.rssi) signals += Math.abs(nodeData.rssi) / 10;
    });

    const status: RfStatus = critical ? "critical" : "safe";
    return { rfStatus: status, detectedSignals: Math.floor(signals) || 5 };
  }, [nodes, predictions, latestPredictions]);

  const rfConfig = {
    safe: {
      color: "emerald",
      bgFrom: "#1a2e1a",
      bgTo: "#0f1910",
      border: "emerald-500/40",
      borderHover: "emerald-400/70",
      icon: Shield,
      text: "SAFE",
      description: "No threats detected",
      barWidth: "25%",
    },
    warning: {
      color: "yellow",
      bgFrom: "#2a1f1a",
      bgTo: "#1a1410",
      border: "yellow-500/40",
      borderHover: "yellow-400/70",
      icon: AlertTriangle,
      text: "WARNING",
      description: "Suspicious activity detected",
      barWidth: "60%",
    },
    critical: {
      color: "red",
      bgFrom: "#2e1a1a",
      bgTo: "#1a0f0f",
      border: "red-500/40",
      borderHover: "red-400/70",
      icon: AlertOctagon,
      text: "CRITICAL",
      description: "Drone detected in vicinity",
      barWidth: "95%",
    },
  } as const;

  const currentStatus = rfConfig[rfStatus];
  const StatusIcon = currentStatus.icon;

  return (
    <div className="grid grid-cols-4 gap-4">
      {/* GATEWAY */}
      <div
        className={`group relative h-[125px] flex flex-col justify-between
  bg-gradient-to-br from-[#1a2332] to-[#0f1419]
  rounded-2xl px-3 py-2 border border-emerald-500/30
  hover:border-emerald-400/60 transition-all duration-500 overflow-hidden
  ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute top-2 right-2">
          <span className="absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
              <div className="p-1 rounded-lg bg-emerald-500/10">
                <Wifi className="w-3 h-3 text-emerald-400" />
              </div>
              Gateway
            </div>
            <Signal className="w-3 h-3 text-emerald-400 animate-pulse" />
          </div>
          <div className="text-lg font-bold leading-none bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
            ONLINE
          </div>
          <div className="mt-1 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full w-full bg-gradient-to-r from-emerald-500 to-green-400 animate-pulse" />
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Main gateway • 99.9% uptime
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-2 gap-2 text-[10px] mt-1">
          <div className="flex items-start gap-1.5 text-slate-400">
            <MapPin className="w-3 h-3 text-emerald-400 mt-[1px]" />
            <div className="leading-tight font-mono">
              <div className="text-slate-500">Location</div>
              <div className="text-slate-300">
                <HoverableLatLon 
                  lat={gateway?.lat || -6.9147} 
                  lon={gateway?.lon || 107.6098} 
                  inline 
                />
              </div>
            </div>
          </div>
          <div className="flex items-start gap-1.5 text-slate-400">
            <Wifi className="w-3 h-3 text-emerald-400 mt-[1px]" />
            <div className="leading-tight">
              <div className="text-slate-500">Network</div>
              <div className="text-slate-300 font-semibold truncate">
                PLOPD_GATEWAY
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVE NODES */}
      <div
        className={`group relative h-[125px] flex flex-col justify-between
        bg-gradient-to-br from-[#1a2332] to-[#0f1419]
        rounded-2xl px-3 py-2 border border-slate-700/50
        hover:border-slate-600 transition-all duration-500 overflow-hidden
        ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-0.5">
            <Wifi className="w-3 h-3" />
            Node Connection
          </div>
          <div className="text-lg font-bold leading-none text-slate-200 mb-1">
            {Object.keys(nodes).length} / 3
          </div>
          <div className="space-y-[3px]">
            {Object.entries(nodes).map(([nodeKey, nodeData]) => {
              // Prioritas: hasil deteksi backend dari Firebase, fallback socket lama
              const livePred = latestPredictions[nodeKey];
              const label =
                predictions[nodeKey]?.prediction_label ??
                livePred?.prediction_label ??
                "No Prediction";
              
              let isConnected = false;
              if (nodeData.captured_at) {
                const capturedTime = new Date(nodeData.captured_at.replace(" ", "T")).getTime();
                if (!isNaN(capturedTime) && (Date.now() - capturedTime) < 2 * 60 * 1000) {
                  isConnected = true;
                }
              }

              const statusColor = isConnected ? "emerald" : "red";
              const statusText = isConnected ? "CONNECTED" : "DISCONNECTED";

              return (
                <div key={nodeKey}>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400 uppercase font-mono">{nodeKey} • <span className="text-cyan-400">{label}</span></span>
                    <span className={`text-${statusColor}-400 font-semibold`}>
                      {statusText}
                    </span>
                  </div>
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden mt-0.5">
                    <div
                      className={`h-full bg-${statusColor}-500 ${isConnected ? "animate-pulse" : "opacity-50"}`}
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* GPS */}
      <div
        className={`group relative h-[125px] flex flex-col justify-between
        bg-gradient-to-br from-[#1a2332] to-[#0f1419]
        rounded-2xl px-3 py-2 border border-slate-700/50
        hover:border-blue-500/40 transition-all duration-500 overflow-hidden
        ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-0.5">
            <MapPin className="w-3 h-3 text-blue-400" />
            GPS Status
          </div>
          <div className="text-lg font-bold leading-none text-blue-400 mb-1 uppercase">Active</div>
          <div className="space-y-[3px] text-[10px] font-mono text-slate-400">
            {gateway?.nodes ? Object.entries(gateway.nodes).map(([nodeKey, coords]) => (
              <div key={nodeKey} className="flex gap-1 items-center">
                <span className="capitalize">{nodeKey.replace('_', ' ')} ·</span>
                <HoverableLatLon lat={coords.lat} lon={coords.lon} />
              </div>
            )) : (
              <div className="text-slate-500 italic">No nodes configured</div>
            )}
          </div>
        </div>
      </div>

      {/* RF COVERAGE - Dynamic Status */}
      <div
        className={`group relative h-[125px] flex flex-col justify-between
        bg-gradient-to-br rounded-2xl px-3 py-2 border-2
        transition-all duration-500 overflow-hidden
        ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        style={{
          backgroundImage: `linear-gradient(to bottom right, ${currentStatus.bgFrom}, ${currentStatus.bgTo})`,
          borderColor: "rgba(0,0,0,0.2)",
        }}
      >
        <div className={`absolute inset-0 bg-gradient-to-br from-${currentStatus.color}-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 pointer-events-none">
          <div className={`absolute inset-0 border-2 border-${currentStatus.color}-500/20 rounded-full animate-ping`} />
          <div className={`absolute inset-4 border-2 border-${currentStatus.color}-500/30 rounded-full animate-ping`} style={{ animationDelay: "0.5s" }} />
        </div>

        <div className="relative z-10">
          <div className={`flex items-center justify-between text-${currentStatus.color}-400 text-xs mb-0.5`}>
            <div className="flex items-center gap-2">
              <div className={`p-1 rounded-lg bg-${currentStatus.color}-500/20`}>
                <StatusIcon className="w-3 h-3 animate-pulse" />
              </div>
              <span className="font-medium">RF Coverage</span>
            </div>
            <div className={`px-2 py-0.5 rounded-full bg-${currentStatus.color}-500/20 border border-${currentStatus.color}-500/40`}>
              <span className="text-[9px] font-bold uppercase">Live</span>
            </div>
          </div>
          <div className={`text-lg font-bold leading-none text-${currentStatus.color}-400 mb-1`}>
            {currentStatus.text}
          </div>
          <div className={`flex items-center justify-between text-[10px] text-${currentStatus.color}-400/80 mb-0.5`}>
            <span>Active Detections</span>
            <span className="font-bold">{detectedSignals}</span>
          </div>
          <div className="h-1.5 bg-slate-800/50 rounded-full overflow-hidden mb-1">
            <div
              className={`h-full bg-gradient-to-r transition-all duration-1000 ${
                currentStatus.color === "emerald" ? "from-emerald-500 to-green-400" : (currentStatus.color as string) === "yellow" ? "from-yellow-500 to-amber-400 animate-pulse" : "from-red-500 to-orange-400 animate-pulse"
              }`}
              style={{ width: currentStatus.barWidth }}
            />
          </div>
          <div className={`text-[10px] text-${currentStatus.color}-400/70 font-medium`}>
            {currentStatus.description} • 2.4 GHz
          </div>
        </div>
      </div>
    </div>
  );
}
