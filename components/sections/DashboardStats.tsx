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
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const key = `${lat.toFixed(6)},${lon.toFixed(6)}`;
  if (geocodeCache.has(key)) return geocodeCache.get(key)!;

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
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
  lat: number;
  lon: number;
  inline?: boolean;
  labelPrefix?: string;
}) {
  const [open, setOpen] = useState(false);
  const { address, loading, err, trigger, reset } = useReverseGeocodeOnHover(
    lat,
    lon
  );
  const fmt = useMemo(() => `${lat.toFixed(4)}, ${lon.toFixed(4)}`, [lat, lon]);

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

export default function DashboardStats() {
  const [mounted, setMounted] = useState(false);

  // Simulasi status RF
  const [rfStatus, setRfStatus] = useState<RfStatus>("warning");
  const [detectedSignals, setDetectedSignals] = useState(12); // Jumlah sinyal terdeteksi

  useEffect(() => {
    // Hindari setTimeout di render; gunakan useEffect
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

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
      signals: "0-5 signals",
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
      signals: "6-15 signals",
    },
    critical: {
      color: "red",
      bgFrom: "#2e1a1a",
      bgTo: "#1a0f0f",
      border: "red-500/40",
      borderHover: "red-400/70",
      icon: AlertOctagon,
      text: "CRITICAL",
      description: "Immediate action required",
      barWidth: "95%",
      signals: "15+ signals",
    },
  } as const;

  const currentStatus = rfConfig[rfStatus];
  const StatusIcon = currentStatus.icon;

  return (
    <div className="grid grid-cols-4 gap-4">
      {/* GATEWAY */}
      <div
        className={`group relative h-[180px] flex flex-col justify-between
  bg-gradient-to-br from-[#1a2332] to-[#0f1419]
  rounded-2xl p-3 border border-emerald-500/30
  hover:border-emerald-400/60 transition-all duration-500 overflow-hidden
  ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        {/* Hover Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Status Dot */}
        <div className="absolute top-3 right-3">
          <span className="absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </div>

        {/* HEADER */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
              <div className="p-1 rounded-lg bg-emerald-500/10">
                <Wifi className="w-3 h-3 text-emerald-400" />
              </div>
              Gateway
            </div>
            <Signal className="w-3 h-3 text-emerald-400 animate-pulse" />
          </div>

          {/* STATUS */}
          <div className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
            ONLINE
          </div>

          {/* UPTIME BAR */}
          <div className="mt-1 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full w-full bg-gradient-to-r from-emerald-500 to-green-400 animate-pulse" />
          </div>

          <div className="text-[10px] text-slate-500 mt-1">
            Main gateway • 99.9% uptime
          </div>
        </div>

        {/* EXTRA INFO */}
        <div className="relative z-10 grid grid-cols-2 gap-2 text-[10px] mt-2">
          {/* LOCATION */}
          <div className="flex items-start gap-1.5 text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 mt-[1px]" />
            <div className="leading-tight font-mono">
              <div className="text-slate-500">Location</div>
              <div className="text-slate-300">
                {/* Koordinat yang bisa di-hover */}
                <HoverableLatLon lat={-6.9147} lon={107.6098} inline />
              </div>
            </div>
          </div>

          {/* NETWORK */}
          <div className="flex items-start gap-1.5 text-slate-400">
            <Wifi className="w-3.5 h-3.5 text-emerald-400 mt-[1px]" />
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
        className={`group relative h-[180px] flex flex-col justify-between
        bg-gradient-to-br from-[#1a2332] to-[#0f1419]
        rounded-2xl p-3 border border-slate-700/50
        hover:border-slate-600 transition-all duration-500 overflow-hidden
        ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <BatteryFull className="w-3 h-3" />
            Active Nodes
          </div>

          <div className="text-xl font-bold text-slate-200 mb-1">3 / 3</div>

          <div className="space-y-1">
            {[
              { name: "Node 1", battery: 92, color: "emerald" },
              { name: "Node 2", battery: 67, color: "yellow" },
              { name: "Node 3", battery: 41, color: "red" },
            ].map((n, i) => (
              <div key={i}>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">{n.name}</span>
                  <span className={`text-${n.color}-400 font-semibold`}>
                    {n.battery}%
                  </span>
                </div>
                <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      n.color === "emerald"
                        ? "bg-emerald-500"
                        : n.color === "yellow"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${n.battery}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GPS */}
      <div
        className={`group relative h-[180px] flex flex-col justify-between
        bg-gradient-to-br from-[#1a2332] to-[#0f1419]
        rounded-2xl p-3 border border-slate-700/50
        hover:border-blue-500/40 transition-all duration-500 overflow-hidden
        ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <MapPin className="w-3 h-3 text-blue-400" />
            GPS Status
          </div>

        <div className="text-xl font-bold text-blue-400 mb-1">ACTIVE</div>

          {/* Daftar node + koord yang bisa di-hover */}
          <div className="space-y-1 text-[10px] font-mono text-slate-400">
            <div className="flex gap-1 items-center">
              <span>Node 1 ·</span>
              <HoverableLatLon lat={-6.9147} lon={107.6098} />
            </div>
            <div className="flex gap-1 items-center">
              <span>Node 2 ·</span>
              <HoverableLatLon lat={-6.9152} lon={107.6103} />
            </div>
            <div className="flex gap-1 items-center">
              <span>Node 3 ·</span>
              <HoverableLatLon lat={-6.9161} lon={107.611} />
            </div>
          </div>
        </div>
      </div>

      {/* RF COVERAGE - Dynamic Status */}
      <div
        className={`group relative h-[180px] flex flex-col justify-between
        bg-gradient-to-br rounded-2xl p-3 border-2
        transition-all duration-500 overflow-hidden
        ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        style={{
          backgroundImage: `linear-gradient(to bottom right, ${currentStatus.bgFrom}, ${currentStatus.bgTo})`,
          borderColor: "rgba(0,0,0,0.2)",
        }}
      >
        {/* Animated background glow */}
        <div
          className={`absolute inset-0 bg-gradient-to-br from-${currentStatus.color}-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
        />

        {/* Radar ping animation */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 pointer-events-none">
          <div
            className={`absolute inset-0 border-2 border-${currentStatus.color}-500/20 rounded-full animate-ping`}
          />
          <div
            className={`absolute inset-4 border-2 border-${currentStatus.color}-500/30 rounded-full animate-ping`}
            style={{ animationDelay: "0.5s" }}
          />
        </div>

        <div className="relative z-10">
          <div
            className={`flex items-center justify-between text-${currentStatus.color}-400 text-sm mb-1`}
          >
            <div className="flex items-center gap-2">
              <div className={`p-1 rounded-lg bg-${currentStatus.color}-500/20`}>
                <StatusIcon className="w-3 h-3 animate-pulse" />
              </div>
              <span className="font-medium">RF Coverage</span>
            </div>
            <div
              className={`px-2 py-0.5 rounded-full bg-${currentStatus.color}-500/20 border border-${currentStatus.color}-500/40`}
            >
              <span className="text-[9px] font-bold">LIVE</span>
            </div>
          </div>

          <div
            className={`text-xl font-bold text-${currentStatus.color}-400 mb-1`}
          >
            {currentStatus.text}
          </div>

          {/* Signal Counter */}
          <div
            className={`flex items-center justify-between text-[10px] text-${currentStatus.color}-400/80 mb-1`}
          >
            <span>Detected Signals</span>
            <span className="font-bold">{detectedSignals}</span>
          </div>

          {/* Threat Level Bar */}
          <div className="h-1.5 bg-slate-800/50 rounded-full overflow-hidden mb-1">
            <div
              className={`h-full bg-gradient-to-r transition-all duration-1000 ${
                currentStatus.color === "emerald"
                  ? "from-emerald-500 to-green-400"
                  : currentStatus.color === "yellow"
                  ? "from-yellow-500 to-amber-400 animate-pulse"
                  : "from-red-500 to-orange-400 animate-pulse"
              }`}
              style={{ width: currentStatus.barWidth }}
            />
          </div>

          <div
            className={`text-[10px] text-${currentStatus.color}-400/70 font-medium`}
          >
            {currentStatus.description} • 2.4 GHz
          </div>
        </div>

        {/* Status Change Buttons (Demo) */}
        <div className="relative z-10 flex gap-1 mt-auto">
          <button
            onClick={() => {
              setRfStatus("safe");
              setDetectedSignals(2);
            }}
            className={`flex-1 py-1 px-2 rounded text-[9px] font-bold transition-all ${
              rfStatus === "safe"
                ? "bg-emerald-500/30 text-emerald-400 border border-emerald-500/50"
                : "bg-slate-800/30 text-slate-500 hover:bg-slate-800/50"
            }`}
          >
            SAFE
          </button>
          <button
            onClick={() => {
              setRfStatus("warning");
              setDetectedSignals(12);
            }}
            className={`flex-1 py-1 px-2 rounded text-[9px] font-bold transition-all ${
              rfStatus === "warning"
                ? "bg-yellow-500/30 text-yellow-400 border border-yellow-500/50"
                : "bg-slate-800/30 text-slate-500 hover:bg-slate-800/50"
            }`}
          >
            WARN
          </button>
          <button
            onClick={() => {
              setRfStatus("critical");
              setDetectedSignals(28);
            }}
            className={`flex-1 py-1 px-2 rounded text-[9px] font-bold transition-all ${
              rfStatus === "critical"
                ? "bg-red-500/30 text-red-400 border border-red-500/50"
                : "bg-slate-800/30 text-slate-500 hover:bg-slate-800/50"
            }`}
          >
            CRIT
          </button>
        </div>
      </div>
    </div>
  );
}
