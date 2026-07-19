"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import type { TimeseriesData, NodeRawData } from "@/types/drone.types";
import { parsePrediction } from "@/utils/prediction";

export function useTimeseries() {
  const [latestPredictions, setLatestPredictions] = useState<Record<string, TimeseriesData>>({});
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

        const newPredictions: Record<string, TimeseriesData> = {};
        const newAlerts: TimeseriesData[] = [];

        Object.entries(data).forEach(([nodeKey, nodeData]: [string, any]) => {
          const raw = nodeData as NodeRawData;
          const { isDrone, label } = parsePrediction(raw.prediction);

          const entry: TimeseriesData = {
            node: raw.node || nodeKey,
            isDrone,
            prediction_label: label,
            timestamp: raw.timestamp || new Date().toISOString(),
            original_data: raw,
          };

          newPredictions[nodeKey] = entry;
          newAlerts.push(entry);
        });

        setLatestPredictions(newPredictions);

        setAlerts((prev) => {
          const combined = [...newAlerts, ...prev];
          const unique = Array.from(
            new Map(combined.map((item) => [`${item.node}-${item.timestamp}`, item])).values()
          );
          unique.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          return unique.slice(0, 20);
        });
      } else {
        setLatestPredictions({});
      }
    });

    return () => {
      unsubscribe();
      setConnected(false);
    };
  }, []);

  return { latestPredictions, alerts, connected, now };
}
