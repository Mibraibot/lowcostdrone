"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export type LivePrediction = {
  node: string;
  prediction_id: number;
  prediction_label: string;
  timestamp: string;
  original_data: any;
};

export function usePredictionSocket() {
  const [latestPredictions, setLatestPredictions] = useState<Record<string, LivePrediction>>({});
  const [alerts, setAlerts] = useState<LivePrediction[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Use environment variable for production socket URL
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
    const socket: Socket = io(socketUrl);

    socket.on("connect", () => {
      console.log("Connected to prediction server");
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from prediction server");
      setConnected(false);
    });

    socket.on("prediction_update", (data: LivePrediction) => {
      console.log("Received prediction:", data);
      
      // Update latest prediction per node
      setLatestPredictions((prev) => ({
        ...prev,
        [data.node]: data,
      }));

      // Add to alerts history (keep last 20)
      setAlerts((prev) => [data, ...prev].slice(0, 20));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { latestPredictions, alerts, connected };
}
