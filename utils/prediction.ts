// ============================================================
// Prediction parsing & RF status computation
// ============================================================

import type { RfStatus, TimeseriesData } from "@/types/drone.types";

/**
 * Parse raw prediction string from Firebase into a structured boolean isDrone + label.
 */
export function parsePrediction(rawPrediction: string): { isDrone: boolean; label: string } {
  const lower = (rawPrediction || "").toLowerCase();

  // If the status is "drone terdeteksi"
  if (lower.includes("drone") || lower.includes("bahaya") || lower.includes("critical")) {
    return { isDrone: true, label: "Drone Terdeteksi" };
  }

  return { isDrone: false, label: "Aman" };
}

/**
 * Compute the overall RF status from all current predictions.
 * Returns the worst-case status and a rough signal count derived from RSSI.
 */
export function computeRfStatus(
  predictions: Record<string, TimeseriesData>
): { status: RfStatus; signalCount: number } {
  let anyDrone = false;
  let signals = 0;

  Object.values(predictions).forEach((pred) => {
    if (pred?.isDrone) anyDrone = true;
    if (pred?.original_data?.rssi) {
      signals += Math.abs(pred.original_data.rssi) / 10;
    }
  });

  const status: RfStatus = anyDrone ? "critical" : "safe";
  return { status, signalCount: Math.floor(signals) || 5 };
}
