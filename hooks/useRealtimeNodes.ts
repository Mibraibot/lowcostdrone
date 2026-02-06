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
    const rootRef = ref(db, "/");

    const unsubscribe = onValue(
      rootRef,
      (snapshot) => {
        const data = snapshot.val() || {};

        // Filter hanya Node*
        const filteredNodes = Object.keys(data)
          .filter((key) => key.startsWith("Node"))
          .reduce((acc, key) => {
            acc[key] = data[key];
            return acc;
          }, {} as NodesMap);

        setNodes(filteredNodes);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      off(rootRef);
      unsubscribe();
    };
  }, []);

  return { nodes, loading, error };
}
