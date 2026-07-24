"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import type { NodeRawData } from "@/types/drone.types";

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