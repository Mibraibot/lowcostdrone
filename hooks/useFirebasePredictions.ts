"use client";

import { useEffect, useRef, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { normalizeNodes } from "./useRealtimeNodes";
import type { NodeData, NodesMap } from "@/types/drone.types";

export type FirebasePrediction = {
  node: string;
  // Dari backend (Gateway_LCDD1/backend/app.py): 0 = AMAN, 1 = DRONE TERDETEKSI
  prediction_id: number;
  prediction_label: string;
  is_drone: boolean;
  // prediction_time dari backend (fallback: captured_at)
  timestamp: string;
  data_hex: string;
};

const MAX_ALERTS = 20;

function extractPredictions(nodes: NodesMap): Record<string, FirebasePrediction> {
  const result: Record<string, FirebasePrediction> = {};
  for (const [nodeKey, node] of Object.entries(nodes)) {
    if (node.prediction_id === undefined && node.prediction_label === undefined) {
      continue;
    }
    const id = node.prediction_id ?? 0;
    const label = node.prediction_label ?? "-";
    result[nodeKey] = {
      node: nodeKey,
      prediction_id: id,
      prediction_label: label,
      is_drone: id === 1 || label.toUpperCase().includes("DRONE"),
      timestamp: node.prediction_time ?? node.captured_at ?? "",
      data_hex: node.data_hex ?? "",
    };
  }
  return result;
}

/**
 * Sumber utama hasil deteksi untuk dashboard.
 * Membaca prediction_id / prediction_label / prediction_time yang ditulis
 * backend ke detection_system/{node} di Firebase Realtime Database, lalu
 * mengakumulasi riwayat alert setiap kali prediksi sebuah node berubah.
 */
export function useFirebasePredictions() {
  const [nodes, setNodes] = useState<NodesMap>({});
  const [predictions, setPredictions] = useState<Record<string, FirebasePrediction>>({});
  const [alerts, setAlerts] = useState<FirebasePrediction[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastSeen = useRef<Record<string, string>>({});

  useEffect(() => {
    const detectionRef = ref(db, "detection_system");

    const unsubscribe = onValue(
      detectionRef,
      (snapshot) => {
        const raw = (snapshot.val() || {}) as Record<string, NodeData>;
        const normalized = normalizeNodes(raw);
        const preds = extractPredictions(normalized);

        // Riwayat alert: tambah entri setiap prediksi sebuah node berubah
        const fresh: FirebasePrediction[] = [];
        for (const pred of Object.values(preds)) {
          const marker = `${pred.timestamp}|${pred.prediction_label}`;
          if (lastSeen.current[pred.node] === marker) continue;
          lastSeen.current[pred.node] = marker;
          fresh.push(pred);
        }

        setNodes(normalized);
        setPredictions(preds);
        if (fresh.length > 0) {
          setAlerts((prev) => [...fresh, ...prev].slice(0, MAX_ALERTS));
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Status koneksi ke Firebase Realtime Database
  useEffect(() => {
    const connRef = ref(db, ".info/connected");
    const unsubscribe = onValue(connRef, (snap) => {
      setConnected(snap.val() === true);
    });
    return () => unsubscribe();
  }, []);

  return { nodes, predictions, alerts, connected, loading, error };
}
