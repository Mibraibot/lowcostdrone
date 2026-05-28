"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

type ManualAlert = {
  timestamp: number;
  node: string;
  data_hex: string;
  prediction_label: string;
  prediction_id: number;
};

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<ManualAlert[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Listen to "detection_system/node1/threats"
    const node1Ref = ref(db, "detection_system/node1/threats");
    
    const unsubscribe = onValue(node1Ref, (snapshot) => {
      setConnected(true);
      const val = snapshot.val();
      
      if (val !== null) {
        const threatValue = Number(val); // Pastikan jadi angka
        
        let label = "SAFE";
        if (threatValue === 2) label = "WARNING";
        if (threatValue === 3) label = "CRITICAL";

        const newAlert: ManualAlert = {
          timestamp: Date.now(),
          node: "Node 1",
          data_hex: "Manual Firebase Override",
          prediction_label: label,
          prediction_id: threatValue,
        };

        // Add to the top of the alerts history (keep max 50 items)
        setAlerts((prev) => {
          // If the last alert is the same, don't spam the history unless you want to
          // Here we just prepend it so we see a live feed of changes
          return [newAlert, ...prev].slice(0, 50);
        });
      }
    }, (error) => {
      console.error("Firebase error:", error);
      setConnected(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="mt-6 bg-[#151b2d] rounded-xl p-6 border border-slate-800">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-slate-300 font-semibold">Live Alerts (Firebase Manual Mode)</h3>
        <div className={`text-[10px] px-2 py-1 rounded-full ${connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {connected ? 'CONNECTED TO FIREBASE' : 'DISCONNECTED'}
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
                  Waiting for manual data from Firebase...
                </td>
              </tr>
            ) : (
              alerts.map((alert, index) => (
                <tr key={`${alert.timestamp}-${index}`} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 text-slate-400">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3 font-mono text-cyan-400">{alert.node}</td>
                  <td className="py-3 font-mono text-cyan-400/80 text-[10px] max-w-[200px] break-all whitespace-normal leading-relaxed">
                    {alert.data_hex}
                  </td>
                  <td className="py-3 text-slate-200">{alert.prediction_label}</td>
                  <td className="py-3">
                    {alert.prediction_id === 3 ? (
                      <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[9px] font-bold border border-red-500/30 animate-pulse">
                        CRITICAL (DRONE)
                      </span>
                    ) : alert.prediction_id === 2 ? (
                      <span className="bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded text-[9px] border border-yellow-500/20">
                        WARNING (WIFI+BT)
                      </span>
                    ) : (
                      <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[9px] border border-emerald-500/10">
                        SAFE (WIFI)
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
