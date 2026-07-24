"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import type { TimeseriesData, NodeRawData } from "@/types/drone.types";
import { parseDetection } from "@/utils/detection";

export function useTimeseries() {
  const [latestDetections, setLatestDetections] = useState<Record<string, TimeseriesData>>({});
  const [alerts, setAlerts] = useState<TimeseriesData[]>([]);
  const [connected, setConnected] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Tick every 5s so connection status stays reactive
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  // Firebase realtime listener on Timeseries/
  useEffect(() => {
    const timeseriesRef = ref(db, "Timeseries");
    setConnected(true);

    const unsubscribe = onValue(timeseriesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        const newDetections: Record<string, TimeseriesData> = {};
        const newAlerts: TimeseriesData[] = [];

        Object.entries(data).forEach(([nodeKey, nodeData]: [string, any]) => {
          const raw = nodeData as NodeRawData;
          // `detection` = key baru; fallback ke `prediction` untuk data lama
          const { isDrone, label } = parseDetection(raw.detection ?? raw.prediction ?? "");

          const entry: TimeseriesData = {
            node: raw.node || nodeKey,
            isDrone,
            detection_label: label,
            timestamp: raw.timestamp || new Date().toISOString(),
            original_data: raw,
          };

          newDetections[nodeKey] = entry;
          newAlerts.push(entry);
        });

        setLatestDetections(newDetections);

        setAlerts((prev) => {
          const combined = [...newAlerts, ...prev];
          const unique = Array.from(
            new Map(combined.map((item) => [`${item.node}-${item.timestamp}`, item])).values()
          );
          unique.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          return unique.slice(0, 20);
        });
      } else {
        setLatestDetections({});
      }
    });

    return () => {
      unsubscribe();
      setConnected(false);
    };
  }, []);

  return { latestDetections, alerts, connected, now };
}