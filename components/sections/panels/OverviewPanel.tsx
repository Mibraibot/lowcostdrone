"use client";

import MapPanel from "@/components/sections/panels/MapPanel";
import { useRealtimeNodes } from "@/hooks/useRealtimeNodes";
import { usePredictionSocket } from "@/hooks/usePredictionSocket";
import { threatConfig, ThreatLevel } from "@/utils/threat";

export default function OverviewPanel() {
  const { nodes, loading } = useRealtimeNodes();
  const { latestPredictions } = usePredictionSocket();

  return (
    <div className="mt-4 grid grid-cols-3 gap-4">
      {/* MAP */}
      <div className="col-span-2 bg-[#151b2d] rounded-xl p-4 h-[550px]">
        <h3 className="mb-2 text-slate-300 font-semibold text-sm">Fleet Locations</h3>
        <div className="h-[480px]">
          <MapPanel />
        </div>
      </div>

      {/* ALERTS */}
      <div className="bg-[#151b2d] rounded-xl p-4 h-[550px] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-slate-200 font-semibold">Real-time Alerts</h3>
          <span className="text-xs text-slate-400">2.4 GHz Monitor</span>
        </div>

        <ul className="space-y-3 text-sm overflow-y-auto flex-1 pr-1">
          {loading && (
            <li className="text-slate-400 text-xs">Loading alerts...</li>
          )}

          {Object.entries(nodes).map(([nodeId, node]) => {
            const livePred = latestPredictions[nodeId];
            const predId = livePred?.prediction_id || 1;
            const predLabel = livePred?.prediction_label || "No Live Data";
            
            // Map prediction_id (1,2,3) to ThreatLevel (1,2,3)
            const threatLevel = predId as ThreatLevel;
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
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-200 font-medium">
                      {nodeId.toUpperCase()} — {predLabel}
                    </p>
                    <p className="text-slate-400 text-xs">
                      RSSI: {node.rssi} dBm · SNR: {node.snr}
                    </p>
                    <p className="text-[10px] text-blue-400 mt-1">
                      Battery: {node.battery}% · Last Sync: {node.timestamp_wib}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={["text-xs font-semibold", config.text].join(" ")}
                    >
                      {config.label}
                    </span>
                  </div>
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
