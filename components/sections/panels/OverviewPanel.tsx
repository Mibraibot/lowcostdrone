"use client";

import MapPanel from "@/components/sections/panels/MapPanel";
import { useTimeseries } from "@/hooks/useTimeseries";
import { threatConfig, ThreatLevel } from "@/utils/threat";
import { isNodeConnected } from "@/utils/connection";

export default function OverviewPanel() {
  const { latestDetections, now } = useTimeseries();

  return (
    <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
      {/* MAP */}
      <div className="col-span-2 bg-[#151b2d] rounded-xl p-4 h-full">
        <h3 className="mb-2 text-slate-300 font-semibold text-sm">Fleet Locations</h3>
        <div className="h-[calc(100%-2rem)]">
          <MapPanel />
        </div>
      </div>

      {/* ALERTS */}
      <div className="bg-[#151b2d] rounded-xl p-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-slate-200 font-semibold">Real-time Alerts</h3>
          <span className="text-xs text-slate-400">2.4 GHz Monitor</span>
        </div>

        <ul className="space-y-3 text-sm overflow-y-auto flex-1 pr-1">
          {Object.entries(latestDetections).map(([nodeId, det]) => {
            const isDrone = det?.isDrone || false;
            const detectionLabel = det?.detection_label || "No Live Data";
            const threatLevel: ThreatLevel = isDrone ? 1 : 0;
            const config = threatConfig[threatLevel];
            if (!config) return null;

            const connected = isNodeConnected(det?.timestamp, now);

            return (
              <li
                key={nodeId}
                className={[
                  "p-3 rounded bg-slate-800 border-l-4",
                  config.border,
                  config.alertClass ?? "",
                ].join(" ")}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-200 font-medium">
                      {nodeId.toUpperCase()} — {detectionLabel}
                    </p>
                    <p className="text-slate-400 text-xs">
                      LoRa Comm Status — RSSI: {det?.original_data?.rssi} · SNR:{" "}
                      {det?.original_data?.snr}
                    </p>
                    <p className="text-[10px] mt-1">
                      <span className={connected ? "text-emerald-400" : "text-red-400"}>
                        Status: {connected ? "Connected" : "Disconnected"}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={["text-xs font-semibold", config.text].join(" ")}>
                      {config.label}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-3 text-xs text-slate-500 border-t border-slate-800 pt-2">
          Alerts generated from RSSI &amp; packet activity
        </div>
      </div>
    </div>
  );
}