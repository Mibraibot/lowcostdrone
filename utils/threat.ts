export type ThreatLevel = 1 | 2 | 3;

export const threatConfig: Record<
  ThreatLevel,
  {
    label: string;
    border: string;
    text: string;
    alertClass?: string;
  }
> = {
  1: {
    label: "SAFE",
    border: "border-green-500",
    text: "text-green-400",
  },
  2: {
    label: "SAFE",
    border: "border-green-500",
    text: "text-green-400",
  },
  3: {
    label: "CRITICAL",
    border: "border-red-500",
    text: "text-red-400",
    alertClass: "alert-critical", // denyut merah
  },
};

// Backend (Gateway_LCDD1/backend/app.py) menulis prediction_id 0 = AMAN,
// 1 = DRONE TERDETEKSI ke detection_system/{node} di Firebase.
export function threatFromBackendPrediction(
  predictionId?: number,
  predictionLabel?: string
): ThreatLevel {
  if (predictionId === 1) return 3;
  if ((predictionLabel ?? "").toUpperCase().includes("DRONE")) return 3;
  return 1;
}
