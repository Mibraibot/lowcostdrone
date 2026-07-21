"use client";

import { useQos } from "@/hooks/useQos";
import type { QosMetricStats } from "@/types/drone.types";

function fmt(v: number | null | undefined, digits = 1) {
  if (v === null || v === undefined || !Number.isFinite(v)) return "-";
  return v.toFixed(digits);
}

function StatTile({
  title,
  stats,
  unit = "ms",
}: {
  title: string;
  stats: QosMetricStats | null | undefined;
  unit?: string;
}) {
  return (
    <div className="bg-[#151b2d] rounded-xl p-4 border border-slate-800">
      <h4 className="text-slate-400 text-xs mb-1">{title}</h4>
      <p className="text-white text-2xl font-semibold">
        {stats ? fmt(stats.mean) : "-"}
        <span className="text-slate-500 text-sm font-normal ml-1">{unit}</span>
      </p>
      <p className="text-slate-500 text-[10px] mt-1">
        min {stats ? fmt(stats.min) : "-"} / max {stats ? fmt(stats.max) : "-"} /
        jitter {stats ? fmt(stats.jitter) : "-"}
      </p>
    </div>
  );
}

export default function QosPanel() {
  const { samples, summary, backendOffset, exportCsv, clearSamples } = useQos();

  const overall = summary.find((s) => s.label === "ALL");
  const perNode = summary.filter((s) => s.label !== "ALL");
  const recent = samples.slice(-15).reverse();

  return (
    <div className="mt-6 space-y-4">
      {/* Header + aksi */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div>
          <h3 className="text-slate-300 font-semibold">
            QoS Monitor (Node &rarr; Gateway &rarr; Backend &rarr; Firebase &rarr; Frontend)
          </h3>
          <p className="text-slate-500 text-xs mt-1">
            {samples.length} sampel terkumpul
            {backendOffset === null && (
              <span className="text-amber-400 ml-2">
                &#9888; offset jam backend belum diterima &mdash; jalankan backend/app.py
                agar metrik lintas-perangkat akurat
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearSamples}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={exportCsv}
            disabled={samples.length === 0}
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Stat tiles per segmen (rata-rata keseluruhan) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatTile title="1. Node → Gateway (RTT poll)" stats={overall?.pollRtt} />
        <StatTile title="Link LoRa murni (RTT − proses node)" stats={overall?.linkDelay} />
        <StatTile title="2. Proses Backend / frame" stats={overall?.backendProc} />
        <StatTile title="3. Backend → Firebase" stats={overall?.backendToFb} />
        <StatTile title="4. Firebase → Frontend" stats={overall?.fbToFe} />
        <StatTile title="End-to-End (poll → browser)" stats={overall?.e2e} />
      </div>

      {/* Statistik per node */}
      <div className="bg-[#151b2d] rounded-xl p-6 border border-slate-800">
        <h3 className="text-slate-300 font-semibold mb-4">Statistik per Node (rata-rata, ms)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-400 border-b border-slate-700/50">
              <tr>
                <th className="text-left py-3 font-medium">Node</th>
                <th className="text-right py-3 font-medium">Sampel</th>
                <th className="text-right py-3 font-medium">Node→GW</th>
                <th className="text-right py-3 font-medium">Backend</th>
                <th className="text-right py-3 font-medium">Backend→FB</th>
                <th className="text-right py-3 font-medium">FB→FE</th>
                <th className="text-right py-3 font-medium">E2E</th>
                <th className="text-right py-3 font-medium">Jitter E2E</th>
                <th className="text-right py-3 font-medium">Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {perNode.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 italic">
                    Menunggu record QoS dari backend...
                  </td>
                </tr>
              ) : (
                perNode.map((row) => (
                  <tr key={row.label} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 font-mono text-cyan-400">{row.label}</td>
                    <td className="py-3 text-right text-slate-300">{row.count}</td>
                    <td className="py-3 text-right text-slate-300">{fmt(row.pollRtt?.mean)}</td>
                    <td className="py-3 text-right text-slate-300">{fmt(row.backendProc?.mean)}</td>
                    <td className="py-3 text-right text-slate-300">{fmt(row.backendToFb?.mean)}</td>
                    <td className="py-3 text-right text-slate-300">{fmt(row.fbToFe?.mean)}</td>
                    <td className="py-3 text-right text-slate-200 font-semibold">{fmt(row.e2e?.mean)}</td>
                    <td className="py-3 text-right text-slate-300">{fmt(row.e2e?.jitter)}</td>
                    <td className="py-3 text-right">
                      {row.lossPct > 3 ? (
                        <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px] border border-red-500/30">
                          {fmt(row.lossPct)}%
                        </span>
                      ) : (
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] border border-emerald-500/10">
                          {fmt(row.lossPct)}%
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

      {/* Sampel terbaru */}
      <div className="bg-[#151b2d] rounded-xl p-6 border border-slate-800">
        <h3 className="text-slate-300 font-semibold mb-4">Sampel Terbaru</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-slate-400 border-b border-slate-700/50">
              <tr>
                <th className="text-left py-3 font-medium">Node</th>
                <th className="text-right py-3 font-medium">Seq</th>
                <th className="text-right py-3 font-medium">RSSI</th>
                <th className="text-right py-3 font-medium">SNR</th>
                <th className="text-right py-3 font-medium">Node→GW</th>
                <th className="text-right py-3 font-medium">Backend</th>
                <th className="text-right py-3 font-medium">FB→FE</th>
                <th className="text-right py-3 font-medium">E2E</th>
                <th className="text-left py-3 font-medium pl-4">Keputusan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 italic">
                    Belum ada sampel
                  </td>
                </tr>
              ) : (
                recent.map((s, i) => (
                  <tr key={`${s.node}-${s.seq}-${i}`} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-2 font-mono text-cyan-400">{s.node}</td>
                    <td className="py-2 text-right text-slate-400">{s.seq ?? "-"}</td>
                    <td className="py-2 text-right text-slate-300">{s.rssi}</td>
                    <td className="py-2 text-right text-slate-300">{s.snr}</td>
                    <td className="py-2 text-right text-slate-300">{fmt(s.pollRttMs)}</td>
                    <td className="py-2 text-right text-slate-300">{fmt(s.backendProcMs)}</td>
                    <td className="py-2 text-right text-slate-300">{fmt(s.fbToFeMs)}</td>
                    <td className="py-2 text-right text-slate-200 font-semibold">{fmt(s.e2eMs)}</td>
                    <td className="py-2 pl-4">
                      {s.decision === "DRONE" ? (
                        <span className="text-red-400">DRONE</span>
                      ) : s.decision === "AMAN" ? (
                        <span className="text-emerald-400">AMAN</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="text-slate-500 text-[10px] mt-3">
          Semua latency dalam ms, diukur terhadap referensi jam server Firebase.
          E2E = RTT poll gateway + proses backend + upload Firebase + delivery ke
          browser (delay serial gateway&rarr;laptop tidak termasuk, &plusmn;30 ms).
        </p>
      </div>
    </div>
  );
}
