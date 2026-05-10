"use client";

import { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import { db } from "@/lib/firebase";
import type { NodesMap } from "@/types/drone.types";

export function useRealtimeNodes() {
  const [nodes, setNodes] = useState<NodesMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detectionRef = ref(db, "detection_system");

    const unsubscribe = onValue(
      detectionRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        
        // Sekarang data langsung berisi node1, node2, node3
        setNodes(data);
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
