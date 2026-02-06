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
    label: "WARNING",
    border: "border-yellow-400",
    text: "text-yellow-400",
    alertClass: "alert-warning", // kedip kuning
  },
  3: {
    label: "CRITICAL",
    border: "border-red-500",
    text: "text-red-400",
    alertClass: "alert-critical", // denyut merah
  },
};
