"use client";

import MapPanel from "@/components/sections/panels/MapPanel";
import { useRealtimeNodes } from "@/hooks/useRealtimeNodes";
import { threatConfig, ThreatLevel } from "@/utils/threat";

export default function OverviewPanel() {
  const { nodes, loading } = useRealtimeNodes();

  return (
    <div className="mt-6 grid grid-cols-3 gap-6">
      {/* MAP */}
      <div className="col-span-2 bg-[#151b2d] rounded-xl p-4 h-[700px]">
        <h3 className="mb-3 text-slate-300 font-semibold">
          Fleet Locations
        </h3>

        <div className="h-[600px]">
          <MapPanel />
        </div>
      </div>

      {/* ALERTS */}
      <div className="bg-[#151b2d] rounded-xl p-4 h-[480px] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-slate-200 font-semibold">
            Real-time Alerts
          </h3>
          <span className="text-xs text-slate-400">
            2.4 GHz Monitor
          </span>
        </div>

        <ul className="space-y-3 text-sm overflow-y-auto flex-1 pr-1">
          {loading && (
            <li className="text-slate-400 text-xs">
              Loading alerts...
            </li>
          )}

          {Object.entries(nodes).map(([nodeId, node]) => {
            const threatLevel = Number(node.threat) as ThreatLevel;
            const config = threatConfig[threatLevel];

            if (!config) return null;

            return (
              <li
                key={nodeId}
                className={[
                  "p-3 rounded bg-slate-800 border-l-4",
                  config.border,
                  config.alertClass ?? "",
                ].join(" ")}
              >
                <div className="flex justify-between">
                  <div>
                    <p className="text-slate-200 font-medium">
                      {nodeId} —{" "}
                      {threatLevel === 1 && "Normal Activity"}
                      {threatLevel === 2 && "Suspicious Signal"}
                      {threatLevel === 3 && "Potential Drone Detected"}
                    </p>

                    <p className="text-slate-400 text-xs">
                      RSSI: {node.RSSI} dBm · Packets: {node.Packet}
                    </p>
                  </div>

                  <span
                    className={[
                      "text-xs font-semibold",
                      config.text,
                    ].join(" ")}
                  >
                    {config.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-3 text-xs text-slate-500 border-t border-slate-800 pt-2">
          Alerts generated from RSSI & packet activity
        </div>
      </div>
    </div>
  );
}
