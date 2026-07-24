// ============================================================
// Detection parsing & RF status computation
// ============================================================

import type { RfStatus, TimeseriesData } from "@/types/drone.types";

/**
 * Parse raw detection string from Firebase into a structured boolean isDrone + label.
 */
export function parseDetection(rawDetection: string): { isDrone: boolean; label: string } {
  const lower = (rawDetection || "").toLowerCase();

  // If the status is "drone terdeteksi"
  if (lower.includes("drone") || lower.includes("bahaya") || lower.includes("critical")) {
    return { isDrone: true, label: "Drone Terdeteksi" };
  }

  return { isDrone: false, label: "Aman" };
}

/**
 * Compute the overall RF status from all current detections.
 * Returns the worst-case status and a rough signal count derived from RSSI.
 */
export function computeRfStatus(
  detections: Record<string, TimeseriesData>
): { status: RfStatus; signalCount: number } {
  let anyDrone = false;
  let signals = 0;

  Object.values(detections).forEach((det) => {
    if (det?.isDrone) anyDrone = true;
    if (det?.original_data?.rssi) {
      signals += Math.abs(det.original_data.rssi) / 10;
    }
  });

  const status: RfStatus = anyDrone ? "critical" : "safe";
  return { status, signalCount: Math.floor(signals) || 5 };
}