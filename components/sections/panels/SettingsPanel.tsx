"use client";

import { useState } from "react";

type NodeConfig = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export default function SettingsPanel() {
  /* 🔊 SOUND */
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(70);

  /* 🏠 HOME BASE */
  const [homeBase, setHomeBase] = useState({
    name: "Main Base",
    lat: -6.200000,
    lng: 106.816666,
  });

  /* 📡 NODES */
  const [nodes, setNodes] = useState<NodeConfig[]>([
    { id: "1", name: "Node A", lat: -6.21, lng: 106.82 },
  ]);

  const addNode = () => {
    setNodes([
      ...nodes,
      {
        id: crypto.randomUUID(),
        name: "",
        lat: 0,
        lng: 0,
      },
    ]);
  };

  return (
    <div className="mt-6 space-y-8 bg-[#151b2d] rounded-xl p-6">

      {/* 🔊 SOUND SETTINGS */}
      <section>
        <h3 className="mb-4 text-slate-300 font-semibold">Sound Alert</h3>

        <div className="flex justify-between items-center mb-3">
          <span>Enable Sound</span>
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(e) => setSoundEnabled(e.target.checked)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-400">Volume</label>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </section>

      {/* 🏠 HOME BASE */}
      <section>
        <h3 className="mb-4 text-slate-300 font-semibold">Home Base</h3>

        <div className="grid grid-cols-3 gap-3">
          <input
            className="bg-slate-800 p-2 rounded"
            placeholder="Name"
            value={homeBase.name}
            onChange={(e) =>
              setHomeBase({ ...homeBase, name: e.target.value })
            }
          />
          <input
            className="bg-slate-800 p-2 rounded"
            placeholder="Latitude"
            type="number"
            value={homeBase.lat}
            onChange={(e) =>
              setHomeBase({ ...homeBase, lat: Number(e.target.value) })
            }
          />
          <input
            className="bg-slate-800 p-2 rounded"
            placeholder="Longitude"
            type="number"
            value={homeBase.lng}
            onChange={(e) =>
              setHomeBase({ ...homeBase, lng: Number(e.target.value) })
            }
          />
        </div>
      </section>

      {/* 📡 NODES */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-slate-300 font-semibold">Nodes</h3>
          <button
            onClick={addNode}
            className="px-3 py-1 text-sm bg-blue-600 rounded"
          >
            + Add Node
          </button>
        </div>

        <div className="space-y-4">
          {nodes.map((node, index) => (
            <div
              key={node.id}
              className="grid grid-cols-4 gap-3 bg-slate-800 p-3 rounded"
            >
              <input
                placeholder="Node Name"
                value={node.name}
                onChange={(e) => {
                  const copy = [...nodes];
                  copy[index].name = e.target.value;
                  setNodes(copy);
                }}
              />
              <input
                placeholder="Lat"
                type="number"
                value={node.lat}
                onChange={(e) => {
                  const copy = [...nodes];
                  copy[index].lat = Number(e.target.value);
                  setNodes(copy);
                }}
              />
              <input
                placeholder="Lng"
                type="number"
                value={node.lng}
                onChange={(e) => {
                  const copy = [...nodes];
                  copy[index].lng = Number(e.target.value);
                  setNodes(copy);
                }}
              />
              <button
                onClick={() =>
                  setNodes(nodes.filter((n) => n.id !== node.id))
                }
                className="text-red-400 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
