"use client";

import MapPanel from "@/components/sections/panels/MapPanel";
import { useFirebasePredictions } from "@/hooks/useFirebasePredictions";
import { usePredictionSocket } from "@/hooks/usePredictionSocket";
import { threatConfig, threatFromBackendPrediction, ThreatLevel } from "@/utils/threat";

export default function OverviewPanel() {
  const { nodes, predictions, loading } = useFirebasePredictions();
  const { latestPredictions } = usePredictionSocket();

  return (
    <div className="mt-4 grid grid-cols-3 gap-4">
      {/* MAP */}
      <div className="col-span-2 bg-[#151b2d] rounded-xl p-4 h-[510px]">
        <h3 className="mb-2 text-slate-300 font-semibold text-sm">Fleet Locations</h3>
        <div className="h-[450px]">
          <MapPanel />
        </div>
      </div>

      {/* ALERTS */}
      <div className="bg-[#151b2d] rounded-xl p-4 h-[510px] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-slate-200 font-semibold">Real-time Alerts</h3>
          <span className="text-xs text-slate-400">2.4 GHz Monitor</span>
        </div>

        <ul className="space-y-3 text-sm overflow-y-auto flex-1 pr-1">
          {loading && (
            <li className="text-slate-400 text-xs">Loading alerts...</li>
          )}

          {Object.entries(nodes).map(([nodeId, node]) => {
            // Prioritas: hasil deteksi backend dari Firebase, fallback socket lama
            const fbPred = predictions[nodeId];
            const livePred = latestPredictions[nodeId];

            const threatLevel: ThreatLevel = fbPred
              ? threatFromBackendPrediction(fbPred.prediction_id, fbPred.prediction_label)
              : ((livePred?.prediction_id === 2 || livePred?.prediction_id === 3
                  ? livePred.prediction_id
                  : 1) as ThreatLevel);
            const predLabel =
              fbPred?.prediction_label ?? livePred?.prediction_label ?? "No Prediction";

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
                    <p className="text-[10px] mt-1">
                      {(() => {
                        let isConnected = false;
                        if (node.captured_at) {
                          const capturedTime = new Date(node.captured_at.replace(" ", "T")).getTime();
                          if (!isNaN(capturedTime) && (Date.now() - capturedTime) < 2 * 60 * 1000) {
                            isConnected = true;
                          }
                        }
                        return (
                          <span className={isConnected ? "text-emerald-400" : "text-red-400"}>
                            Status: {isConnected ? "Connected" : "Disconnected"}
                          </span>
                        );
                      })()}
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
