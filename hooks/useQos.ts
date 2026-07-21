"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import type { QosLiveRecord, QosSample, QosMetricStats } from "@/types/drone.types";

const MAX_SAMPLES = 2000;

/** Hitung statistik agregat satu metrik (mean/min/max/stdev/jitter). */
export function computeStats(values: number[]): QosMetricStats | null {
  const v = values.filter((x) => Number.isFinite(x));
  if (v.length === 0) return null;
  const mean = v.reduce((a, b) => a + b, 0) / v.length;
  const min = Math.min(...v);
  const max = Math.max(...v);
  const stdev =
    v.length > 1
      ? Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / (v.length - 1))
      : 0;
  // Jitter = rata-rata selisih absolut delay berurutan (variasi delay)
  let jitterSum = 0;
  for (let i = 1; i < v.length; i++) jitterSum += Math.abs(v[i] - v[i - 1]);
  const jitter = v.length > 1 ? jitterSum / (v.length - 1) : 0;
  return { count: v.length, mean, min, max, stdev, jitter };
}

/**
 * Monitoring QoS real-time dari sisi frontend.
 *
 * Prinsip pengukuran lintas-perangkat: semua timestamp dikonversi ke
 * SATU referensi jam, yaitu jam server Firebase.
 * - Browser  : .info/serverTimeOffset (disediakan SDK Firebase)
 * - Backend  : qos/meta/backend_offset_ms (diestimasi backend, metode NTP)
 * - server_ts: jam server saat record QoS tertulis (sentinel .sv backend)
 *
 * Latency per segmen:
 * - backendToFbMs = server_ts - (backend_sent_at + backendOffset)
 * - fbToFeMs      = (Date.now() + serverOffset) - server_ts
 * - e2eMs         = pollRtt + (nowServer - (backend_rx_at + backendOffset))
 *   (delay serial Gateway->laptop ~konstan & kecil, dibahas di dokumen uji)
 */
export function useQos() {
  const [samples, setSamples] = useState<QosSample[]>([]);
  const [serverOffset, setServerOffset] = useState(0);
  const [backendOffset, setBackendOffset] = useState<number | null>(null);
  const serverOffsetRef = useRef(0);
  const backendOffsetRef = useRef<number | null>(null);
  const lastKeyRef = useRef<Record<string, string>>({});

  // Offset jam browser terhadap jam server Firebase
  useEffect(() => {
    const offRef = ref(db, ".info/serverTimeOffset");
    const unsubscribe = onValue(offRef, (snapshot) => {
      const v = Number(snapshot.val()) || 0;
      serverOffsetRef.current = v;
      setServerOffset(v);
    });
    return () => unsubscribe();
  }, []);

  // Offset jam laptop backend terhadap jam server (dipublikasikan backend)
  useEffect(() => {
    const metaRef = ref(db, "qos/meta/backend_offset_ms");
    const unsubscribe = onValue(metaRef, (snapshot) => {
      if (snapshot.exists()) {
        const v = Number(snapshot.val());
        backendOffsetRef.current = v;
        setBackendOffset(v);
      }
    });
    return () => unsubscribe();
  }, []);

  // Record QoS per frame dari backend
  useEffect(() => {
    const liveRef = ref(db, "qos/live");
    const unsubscribe = onValue(liveRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const nowServer = Date.now() + serverOffsetRef.current;
      const data = snapshot.val() as Record<string, QosLiveRecord>;
      const fresh: QosSample[] = [];

      Object.entries(data).forEach(([nodeKey, rec]) => {
        if (!rec || typeof rec.server_ts !== "number") return;

        // Deduplikasi: onValue menyala untuk seluruh subtree, proses hanya
        // record yang benar-benar baru per node (kombinasi seq + server_ts)
        const key = `${rec.seq}-${rec.server_ts}`;
        if (lastKeyRef.current[nodeKey] === key) return;
        lastKeyRef.current[nodeKey] = key;

        const bOff = backendOffsetRef.current;
        const fbToFeMs = nowServer - rec.server_ts;
        const backendToFbMs =
          bOff !== null ? rec.server_ts - (rec.backend_sent_at + bOff) : null;
        const backendProcMs = rec.backend_sent_at - rec.backend_rx_at;
        const e2eMs =
          bOff !== null && typeof rec.poll_rtt_ms === "number"
            ? rec.poll_rtt_ms + (nowServer - (rec.backend_rx_at + bOff))
            : null;

        fresh.push({
          node: rec.node || nodeKey,
          seq: rec.seq ?? null,
          event: rec.event || "-",
          rssi: rec.rssi,
          snr: rec.snr,
          pollRttMs: rec.poll_rtt_ms ?? null,
          nodeProcMs: rec.node_proc_ms ?? null,
          linkDelayMs: rec.link_delay_ms ?? null,
          decision: rec.decision || "",
          decisionMs: rec.decision_ms ?? null,
          backendProcMs,
          fbRawMs: rec.fb_raw_ms,
          backendToFbMs,
          fbToFeMs,
          e2eMs,
          lossPct: rec.loss_pct ?? 0,
          arrivedAtServer: nowServer,
        });
      });

      if (fresh.length > 0) {
        setSamples((prev) => [...prev, ...fresh].slice(-MAX_SAMPLES));
      }
    });
    return () => unsubscribe();
  }, []);

  // Statistik agregat per node + keseluruhan
  const summary = useMemo(() => {
    const groups: Record<string, QosSample[]> = { ALL: samples };
    samples.forEach((s) => {
      if (!groups[s.node]) groups[s.node] = [];
      groups[s.node].push(s);
    });

    return Object.entries(groups).map(([label, group]) => ({
      label,
      count: group.length,
      lossPct: group.length > 0 ? group[group.length - 1].lossPct : 0,
      pollRtt: computeStats(group.map((s) => s.pollRttMs ?? NaN)),
      linkDelay: computeStats(group.map((s) => s.linkDelayMs ?? NaN)),
      backendProc: computeStats(group.map((s) => s.backendProcMs)),
      backendToFb: computeStats(group.map((s) => s.backendToFbMs ?? NaN)),
      fbToFe: computeStats(group.map((s) => s.fbToFeMs)),
      e2e: computeStats(group.map((s) => s.e2eMs ?? NaN)),
    }));
  }, [samples]);

  /** Export seluruh sampel ke CSV (bahan analisis analyze_qos.py). */
  const exportCsv = () => {
    const header =
      "node,seq,event,rssi,snr,poll_rtt_ms,node_proc_ms,link_delay_ms," +
      "decision,decision_ms,backend_proc_ms,fb_raw_ms,backend_to_fb_ms," +
      "fb_to_fe_ms,e2e_ms,loss_pct,arrived_at_server_ms\n";
    const rows = samples
      .map((s) =>
        [
          s.node,
          s.seq ?? "",
          s.event,
          s.rssi,
          s.snr,
          s.pollRttMs ?? "",
          s.nodeProcMs ?? "",
          s.linkDelayMs ?? "",
          s.decision,
          s.decisionMs ?? "",
          s.backendProcMs.toFixed(1),
          s.fbRawMs,
          s.backendToFbMs !== null ? s.backendToFbMs.toFixed(1) : "",
          s.fbToFeMs.toFixed(1),
          s.e2eMs !== null ? s.e2eMs.toFixed(1) : "",
          s.lossPct,
          Math.round(s.arrivedAtServer),
        ].join(",")
      )
      .join("\n");

    const stamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace("T", "_")
      .slice(0, 15);
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qos_frontend_${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearSamples = () => {
    setSamples([]);
    lastKeyRef.current = {};
  };

  return { samples, summary, serverOffset, backendOffset, exportCsv, clearSamples };
}
