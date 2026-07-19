"use client";

import React, { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { MapPin } from "lucide-react";
import { reverseGeocode, formatCoord } from "@/utils/geo";

// ============================================================
// Debounce helper
// ============================================================
function useDebouncedCallback<T extends (...args: unknown[]) => void>(fn: T, delay = 250) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (...args: Parameters<T>) => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => fn(...(args as Parameters<T>)), delay);
  };
}

// ============================================================
// Reverse geocode on hover (internal hook)
// ============================================================
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

  const reset = () => setErr(null);

  return { address, loading, err, trigger, reset };
}

// ============================================================
// Tooltip Portal (renders in document.body to avoid overflow)
// ============================================================
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
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.createElement("div");
    el.setAttribute("data-portal", "latlon-tooltip");
    document.body.appendChild(el);
    setPortalContainer(el);
    return () => {
      document.body.removeChild(el);
      setPortalContainer(null);
    };
  }, []);

  useLayoutEffect(() => {
    if (!open) return;

    function place() {
      const anchor = anchorEl;
      const tt = tooltipRef.current;
      if (!anchor || !tt) return;

      const a = anchor.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      tt.style.visibility = "hidden";
      tt.style.left = "0px";
      tt.style.top = "0px";
      tt.style.maxWidth = "280px";
      tt.style.position = "fixed";
      tt.style.pointerEvents = "none";
      tt.style.zIndex = "9999";

      const { width: tw, height: th } = tt.getBoundingClientRect();

      let left = Math.round(a.left + a.width / 2 - tw / 2);
      let top = Math.round(a.top - offset - th);

      if (a.top < th + offset + 8) {
        top = Math.round(a.bottom + offset);
      }

      const margin = 8;
      left = Math.min(Math.max(margin, left), vw - tw - margin);
      if (top + th + margin > vh) top = Math.round(a.top - th - offset);
      if (top < margin) top = margin;

      tt.style.left = `${left}px`;
      tt.style.top = `${top}px`;
      tt.style.visibility = "visible";
    }

    place();

    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);

    let ro: ResizeObserver | null = null;
    if (anchorEl && "ResizeObserver" in window) {
      ro = new ResizeObserver(place);
      ro.observe(anchorEl);
    }

    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
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

// ============================================================
// HoverableLatLon — public component
// ============================================================
export default function HoverableLatLon({
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
  const fmt = useMemo(() => formatCoord(lat, lon), [lat, lon]);
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
            <div className="text-[9px] uppercase tracking-wider text-slate-400">Koordinat</div>
            <div className="font-mono text-slate-100 font-semibold">{fmt}</div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 mt-1">Alamat</div>
            <div className="text-slate-200">
              {loading && "Memuat alamat…"}
              {!loading && err && <span className="text-red-300">Gagal memuat alamat</span>}
              {!loading && !err && (address || "Alamat tidak ditemukan")}
            </div>
          </div>
        </div>
      </TooltipPortal>
    </>
  );
}
