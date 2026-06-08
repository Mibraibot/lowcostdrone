"use client";

import { useState, useEffect } from "react";
import { ref, set, onValue } from "firebase/database";
import { db } from "@/lib/firebase";

export default function SettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [gateway, setGateway] = useState<any>({
    lat: -6.969170,
    lon: 107.628050,
    nodes: {
      node1: { lat: -6.969358, lon: 107.628097 },
      node2: { lat: -6.969536, lon: 107.628025 },
      node3: { lat: -6.969566, lon: 107.628228 },
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
      const parsedNodes: any = {};
      if (gateway.nodes) {
        Object.keys(gateway.nodes).forEach(key => {
          parsedNodes[key] = {
            lat: Number(gateway.nodes[key].lat) || 0,
            lon: Number(gateway.nodes[key].lon) || 0
          };
        });
      }
      const parsedGateway = {
        lat: Number(gateway.lat) || 0,
        lon: Number(gateway.lon) || 0,
        nodes: parsedNodes
      };
      await set(ref(db, "gateway"), parsedGateway);
      showToast("Settings saved successfully!", "success");
    } catch (error) {
      console.error("Error saving settings:", error);
      showToast("Failed to save settings.", "error");
    }
  };

  if (loading) return <div className="p-6 text-slate-400">Loading settings...</div>;

  return (
    <div className="mt-4 space-y-4 bg-[#151b2d] rounded-xl p-4 border border-slate-800/50 relative">
      
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-4 py-3 rounded-lg shadow-2xl border text-sm font-bold flex items-center gap-2 transition-all animate-in slide-in-from-top-5 duration-300 ${
          toast.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-400 backdrop-blur-md' 
            : 'bg-red-950/80 border-red-500/50 text-red-400 backdrop-blur-md'
        }`}>
          {toast.type === 'success' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {toast.message}
        </div>
      )}

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
              type="text"
              value={gateway.lat}
              onChange={(e) => setGateway({ ...gateway, lat: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 uppercase tracking-wider">Longitude</label>
            <input
              className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-sm text-slate-200 focus:border-blue-500"
              type="text"
              value={gateway.lon}
              onChange={(e) => setGateway({ ...gateway, lon: e.target.value })}
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
                    type="text"
                    value={gateway.nodes[nodeKey].lat}
                    onChange={(e) => {
                      const newGateway = { ...gateway };
                      newGateway.nodes[nodeKey].lat = e.target.value;
                      setGateway(newGateway);
                    }}
                  />
                </div>
                <div className="space-y-0.5">
                  <label className="text-[9px] text-slate-500 uppercase">Lon</label>
                  <input
                    className="w-full bg-slate-900 border border-slate-700 p-1.5 rounded text-[11px] text-slate-200"
                    type="text"
                    value={gateway.nodes[nodeKey].lon}
                    onChange={(e) => {
                      const newGateway = { ...gateway };
                      newGateway.nodes[nodeKey].lon = e.target.value;
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
