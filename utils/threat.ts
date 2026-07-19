// ============================================================
// Threat level config & RF status display config
// ============================================================

import type { RfStatus } from "@/types/drone.types";
import { Shield, AlertOctagon, type LucideIcon } from "lucide-react";

export type ThreatLevel = 0 | 1;

export const threatConfig: Record<
  ThreatLevel,
  {
    label: string;
    border: string;
    text: string;
    alertClass?: string;
  }
> = {
  0: {
    label: "SAFE",
    border: "border-green-500",
    text: "text-green-400",
  },
  1: {
    label: "CRITICAL",
    border: "border-red-500",
    text: "text-red-400",
    alertClass: "alert-critical",
  },
};

/** Visual config for the RF Coverage card, keyed by RfStatus */
export type RfStatusConfig = {
  color: "emerald" | "red";
  bgFrom: string;
  bgTo: string;
  border: string;
  borderHover: string;
  icon: LucideIcon;
  text: string;
  description: string;
  barWidth: string;
};

export const rfStatusConfig: Record<RfStatus, RfStatusConfig> = {
  safe: {
    color: "emerald",
    bgFrom: "#1a2e1a",
    bgTo: "#0f1910",
    border: "emerald-500/40",
    borderHover: "emerald-400/70",
    icon: Shield,
    text: "SAFE",
    description: "No threats detected",
    barWidth: "25%",
  },
  critical: {
    color: "red",
    bgFrom: "#2e1a1a",
    bgTo: "#1a0f0f",
    border: "red-500/40",
    borderHover: "red-400/70",
    icon: AlertOctagon,
    text: "CRITICAL",
    description: "Drone detected in vicinity",
    barWidth: "95%",
  },
};
