"use client";

import { useTimeseries } from "@/hooks/useTimeseries";

export default function AlertsPanel() {
  const { alerts, connected } = useTimeseries();

  return (
    <div className="mt-6 bg-[#151b2d] rounded-xl p-6 border border-slate-800">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-slate-300 font-semibold">Live Alerts (Firebase)</h3>
        <div
          className={`text-[10px] px-2 py-1 rounded-full ${
            connected ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
          }`}
        >
          {connected ? "CONNECTED" : "DISCONNECTED"}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-slate-400 border-b border-slate-700/50">
            <tr>
              <th className="text-left py-3 font-medium">Time</th>
              <th className="text-left py-3 font-medium">Node</th>
              <th className="text-left py-3 font-medium">Data Hex</th>
              <th className="text-left py-3 font-medium">Prediction</th>
              <th className="text-left py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {alerts.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                  Waiting for live data...
                </td>
              </tr>
            ) : (
              alerts.map((alert, index) => (
                <tr
                  key={`${alert.timestamp}-${index}`}
                  className="hover:bg-slate-800/20 transition-colors"
                >
                  <td className="py-3 text-slate-400">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3 font-mono text-cyan-400">{alert.node}</td>
                  <td className="py-3 font-mono text-cyan-400/80 text-[10px] max-w-[200px] break-all whitespace-normal leading-relaxed">
                    {alert.original_data?.data_hex
                      ? String(alert.original_data.data_hex)
                      : "No Hex Data"}
                  </td>
                  <td className="py-3 text-slate-200">{alert.prediction_label}</td>
                  <td className="py-3">
                    {alert.isDrone ? (
                      <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[9px] font-bold border border-red-500/30 animate-pulse">
                        CRITICAL (DRONE)
                      </span>
                    ) : (
                      <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[9px] border border-emerald-500/10">
                        SAFE
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
