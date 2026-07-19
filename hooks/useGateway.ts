"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import type { GatewayConfig } from "@/types/drone.types";

export function useGateway() {
  const [gateway, setGateway] = useState<GatewayConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const gatewayRef = ref(db, "gateway");
    const unsubscribe = onValue(gatewayRef, (snapshot) => {
      if (snapshot.exists()) {
        setGateway(snapshot.val());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { gateway, loading };
}
