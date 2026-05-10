"use client";

import { useState, useEffect } from "react";
import { ref, set, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

export default function SettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [gateway, setGateway] = useState({
    lat: -6.200000,
    lon: 106.816666,
    nodes: {
      node1: { lat: -6.210000, lon: 106.820000 },
      node2: { lat: -6.190000, lon: 106.810000 },
      node3: { lat: -6.205000, lon: 106.830000 },
    }
  });

  // Fetch current settings from Firebase
  useEffect(() => {
    const gatewayRef = ref(db, "gateway");
    const unsubscribe = onValue(gatewayRef, (snapshot) => {
      if (snapshot.exists()) {
        setGateway(snapshot.val());
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    try {
      await set(ref(db, "gateway"), gateway);
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings.");
    }
  };

  if (loading) return <div className="p-6 text-slate-400">Loading settings...</div>;

  return (
    <div className="mt-4 space-y-4 bg-[#151b2d] rounded-xl p-4 border border-slate-800/50">
      
      {/* 📡 GATEWAY COORDINATES */}
      <section className="bg-slate-900/30 p-3 rounded-lg border border-slate-800">
        <h3 className="text-slate-300 text-sm font-semibold mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          Gateway Location
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase tracking-wider">Latitude</label>
            <input
              className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-sm text-slate-200 focus:border-blue-500"
              type="number"
              value={gateway.lat}
              onChange={(e) => setGateway({ ...gateway, lat: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase tracking-wider">Longitude</label>
            <input
              className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-sm text-slate-200 focus:border-blue-500"
              type="number"
              value={gateway.lon}
              onChange={(e) => setGateway({ ...gateway, lon: Number(e.target.value) })}
            />
          </div>
        </div>
      </section>

      {/* 📡 NODES COORDINATES (Horizontal Grid) */}
      <section className="space-y-3">
        <h3 className="text-slate-300 text-sm font-semibold border-b border-slate-800 pb-1">Nodes Placement</h3>
        
        <div className="grid grid-cols-3 gap-3">
          {Object.keys(gateway.nodes).map((nodeKey) => (
            <div key={nodeKey} className="space-y-2 p-3 bg-slate-900/50 rounded-xl border border-slate-800">
              <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{nodeKey}</h4>
              <div className="space-y-2">
                <div className="space-y-0.5">
                  <label className="text-[9px] text-slate-500 uppercase">Lat</label>
                  <input
                    className="w-full bg-slate-900 border border-slate-700 p-1.5 rounded text-[11px] text-slate-200"
                    type="number"
                    value={gateway.nodes[nodeKey as keyof typeof gateway.nodes].lat}
                    onChange={(e) => {
                      const newGateway = { ...gateway };
                      newGateway.nodes[nodeKey as keyof typeof gateway.nodes].lat = Number(e.target.value);
                      setGateway(newGateway);
                    }}
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] text-slate-500 uppercase">Lon</label>
                  <input
                    className="w-full bg-slate-900 border border-slate-700 p-1.5 rounded text-[11px] text-slate-200"
                    type="number"
                    value={gateway.nodes[nodeKey as keyof typeof gateway.nodes].lon}
                    onChange={(e) => {
                      const newGateway = { ...gateway };
                      newGateway.nodes[nodeKey as keyof typeof gateway.nodes].lon = Number(e.target.value);
                      setGateway(newGateway);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 💾 ACTION BUTTONS */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2.5 rounded-xl transition-all active:scale-95"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
}
