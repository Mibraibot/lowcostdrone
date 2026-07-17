"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import type { NodeData, NodesMap } from "@/types/drone.types";

function capturedAtMs(node: NodeData): number {
  if (!node?.captured_at) return 0;
  const t = new Date(node.captured_at.replace(" ", "T")).getTime();
  return isNaN(t) ? 0 : t;
}

// Firebase bisa berisi kunci lama ("Node3", dari firmware lama) dan kunci baru
// ("node3", dari backend/app.py) sekaligus. Normalisasi ke huruf kecil dan
// pertahankan entri dengan captured_at terbaru agar node tidak tampil ganda.
export function normalizeNodes(raw: Record<string, NodeData>): NodesMap {
  const normalized: NodesMap = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!value || typeof value !== "object") continue;
    const nodeKey = key.toLowerCase();
    const existing = normalized[nodeKey];
    if (!existing || capturedAtMs(value) >= capturedAtMs(existing)) {
      normalized[nodeKey] = value;
    }
  }
  return normalized;
}

export function useRealtimeNodes() {
  const [nodes, setNodes] = useState<NodesMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detectionRef = ref(db, "detection_system");

    const unsubscribe = onValue(
      detectionRef,
      (snapshot) => {
        const raw = (snapshot.val() || {}) as Record<string, NodeData>;
        setNodes(normalizeNodes(raw));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { nodes, loading, error };
}
