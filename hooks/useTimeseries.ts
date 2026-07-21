"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import type { TimeseriesData, NodeRawData } from "@/types/drone.types";
import { parsePrediction } from "@/utils/prediction";
import { useDetectionSystem } from "@/hooks/useDetectionSystem";

/** Raw shape stored under Firebase `Timeseries/{NodeX}` (decision archive). */
type TimeseriesRaw = {
  node?: string;
  prediction?: string;
  timestamp?: string;
};

/**
 * Build one merged per-node view from the two backend sources:
 *  - `Timeseries/{NodeX}`       -> authoritative prediction decision.
 *  - `detection_system/{nodeX}` -> live rssi / snr / data_hex / captured_at.
 */
function buildNodeEntry(
  key: string,
  ts: TimeseriesRaw | undefined,
  det: NodeRawData | undefined
): TimeseriesData {
  // Prediction: Timeseries is authoritative, fall back to detection_system.
  const rawPrediction =
    ts?.prediction ??
    det?.prediction_label ??
    (typeof det?.prediction_id === "number"
      ? det.prediction_id
        ? "Drone Terdeteksi"
        : "Aman"
      : "");

  const hasPrediction = rawPrediction !== "";
  const { isDrone, label } = parsePrediction(rawPrediction);

  // Best available "last update" timestamp. detection_system.captured_at is
  // refreshed on every frame, so it keeps connection status responsive even
  // between detection decisions.
  const timestamp = ts?.timestamp || det?.captured_at || det?.prediction_time || "";
  const node = det?.node || ts?.node || key;

  return {
    node,
    isDrone,
    prediction_label: hasPrediction ? label : "No Prediction",
    timestamp,
    original_data: {
      ...(det || {}),
      node,
      prediction: rawPrediction,
      timestamp,
    },
  };
}

/** Merge both Firebase paths, normalizing node keys to lowercase. */
function mergeSources(
  timeseries: Record<string, TimeseriesRaw>,
  detections: Record<string, NodeRawData>
): Record<string, TimeseriesData> {
  const tsByKey: Record<string, TimeseriesRaw> = {};
  Object.entries(timeseries || {}).forEach(([k, v]) => {
    tsByKey[k.toLowerCase()] = v;
  });

  const detByKey: Record<string, NodeRawData> = {};
  Object.entries(detections || {}).forEach(([k, v]) => {
    detByKey[k.toLowerCase()] = v;
  });

  const keys = new Set<string>([...Object.keys(tsByKey), ...Object.keys(detByKey)]);

  const merged: Record<string, TimeseriesData> = {};
  keys.forEach((key) => {
    merged[key] = buildNodeEntry(key, tsByKey[key], detByKey[key]);
  });
  return merged;
}

export function useTimeseries() {
  const [timeseries, setTimeseries] = useState<Record<string, TimeseriesRaw>>({});
  const [alerts, setAlerts] = useState<TimeseriesData[]>([]);
  const [connected, setConnected] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Live raw frame data (rssi / snr / data_hex) — this is where those values
  // actually live in Firebase, so the dashboard stays in sync with the backend.
  const { detections } = useDetectionSystem();

  // Keep the freshest detection_system snapshot reachable from the Timeseries
  // subscription callback without turning it into an effect dependency.
  const detectionsRef = useRef<Record<string, NodeRawData>>(detections);
  useEffect(() => {
    detectionsRef.current = detections;
  }, [detections]);

  // Tick every 5s so connection status stays reactive
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  // Firebase realtime listener on Timeseries/ (prediction decisions)
  useEffect(() => {
    const timeseriesRef = ref(db, "Timeseries");

    const unsubscribe = onValue(timeseriesRef, (snapshot) => {
      setConnected(true);

      const data: Record<string, TimeseriesRaw> = snapshot.exists() ? snapshot.val() : {};
      setTimeseries(data);

      // Log each decision into the rolling alert history, enriched with the
      // latest raw frame (data_hex) captured by detection_system.
      const detByKey: Record<string, NodeRawData> = {};
      Object.entries(detectionsRef.current || {}).forEach(([k, v]) => {
        detByKey[k.toLowerCase()] = v;
      });

      const newAlerts = Object.entries(data)
        .map(([k, v]) => buildNodeEntry(k.toLowerCase(), v, detByKey[k.toLowerCase()]))
        .filter((entry) => entry.prediction_label !== "No Prediction" && entry.timestamp);

      if (newAlerts.length > 0) {
        setAlerts((prev) => {
          const combined = [...newAlerts, ...prev];
          const unique = Array.from(
            new Map(combined.map((item) => [`${item.node}-${item.timestamp}`, item])).values()
          );
          unique.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          return unique.slice(0, 20);
        });
      }
    });

    return () => {
      unsubscribe();
      setConnected(false);
    };
  }, []);

  // Always-in-sync live view, reactive to BOTH Timeseries and detection_system.
  const latestPredictions = useMemo(
    () => mergeSources(timeseries, detections),
    [timeseries, detections]
  );

  return { latestPredictions, alerts, connected, now };
}
