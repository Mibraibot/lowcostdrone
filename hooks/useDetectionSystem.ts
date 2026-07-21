"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import type { NodeRawData } from "@/types/drone.types";

/**
 * Live per-node raw data written by the gateway backend (app.py) to
 * Firebase `detection_system/{node1|node2|node3}`.
 *
 * This is where `rssi`, `snr` and `data_hex` actually live and get refreshed
 * on every frame — the `Timeseries/` path only stores the prediction decision
 * (`prediction` + `timestamp`). The dashboard needs this hook so those signal
 * values stay in sync with the backend instead of showing `undefined`.
 *
 * Keys are returned exactly as stored (lowercase: node1, node2, node3).
 */
export function useDetectionSystem() {
  const [detections, setDetections] = useState<Record<string, NodeRawData>>({});

  useEffect(() => {
    const detectionRef = ref(db, "detection_system");
    const unsubscribe = onValue(detectionRef, (snapshot) => {
      setDetections(snapshot.exists() ? snapshot.val() : {});
    });

    return () => unsubscribe();
  }, []);

  return { detections };
}
