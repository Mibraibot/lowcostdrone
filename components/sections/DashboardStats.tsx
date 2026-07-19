"use client";

import { Wifi, MapPin, Signal } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import { useTimeseries } from "@/hooks/useTimeseries";
import { useGateway } from "@/hooks/useGateway";
import { computeRfStatus } from "@/utils/prediction";
import { rfStatusConfig } from "@/utils/threat";
import { isNodeConnected } from "@/utils/connection";
import HoverableLatLon from "@/components/ui/HoverableLatLon";

export default function DashboardStats() {
  const [mounted, setMounted] = useState(false);
  const { latestPredictions, now } = useTimeseries();
  const { gateway } = useGateway();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const { status: rfStatus, signalCount } = useMemo(
    () => computeRfStatus(latestPredictions),
    [latestPredictions]
  );

  const currentStatus = rfStatusConfig[rfStatus];
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
              <div className="text-slate-300 font-semibold truncate">PLOPD_GATEWAY</div>
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
            {Object.keys(latestPredictions).length} / 3
          </div>
          <div className="space-y-[3px]">
            {Object.entries(latestPredictions).map(([nodeKey, pred]) => {
              const label = pred?.prediction_label || "No Prediction";
              const connected = isNodeConnected(pred?.timestamp, now);
              const statusColor = connected ? "emerald" : "red";
              const statusText = connected ? "CONNECTED" : "DISCONNECTED";

              return (
                <div key={nodeKey}>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400 uppercase font-mono">
                      {nodeKey} • <span className="text-cyan-400">{label}</span>
                    </span>
                    <span className={`text-${statusColor}-400 font-semibold`}>{statusText}</span>
                  </div>
                  <div className="h-1 bg-slate-700 rounded-full overflow-hidden mt-0.5">
                    <div
                      className={`h-full bg-${statusColor}-500 ${connected ? "animate-pulse" : "opacity-50"}`}
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
            {gateway?.nodes ? (
              Object.entries(gateway.nodes).map(([nodeKey, coords]) => (
                <div key={nodeKey} className="flex gap-1 items-center">
                  <span className="capitalize">{nodeKey.replace("_", " ")} ·</span>
                  <HoverableLatLon lat={coords.lat} lon={coords.lon} />
                </div>
              ))
            ) : (
              <div className="text-slate-500 italic">No nodes configured</div>
            )}
          </div>
        </div>
      </div>

      {/* RF COVERAGE */}
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
          <div
            className={`absolute inset-4 border-2 border-${currentStatus.color}-500/30 rounded-full animate-ping`}
            style={{ animationDelay: "0.5s" }}
          />
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
            <span className="font-bold">{signalCount}</span>
          </div>
          <div className="h-1.5 bg-slate-800/50 rounded-full overflow-hidden mb-1">
            <div
              className={`h-full bg-gradient-to-r transition-all duration-1000 ${
                currentStatus.color === "emerald"
                  ? "from-emerald-500 to-green-400"
                  : "from-red-500 to-orange-400 animate-pulse"
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
