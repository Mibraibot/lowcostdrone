// ============================================================
// Central type definitions for the drone detection dashboard
// ============================================================

/** Raw data shape coming from Firebase Timeseries/{NodeX} */
export type NodeRawData = {
  data_hex: string;
  node: string;
  detection?: string; // "Aman" | "Drone Terdeteksi"
  prediction?: string; // legacy (pra-rename), dibaca sbg fallback utk data lama
  rssi: number;
  snr: number;
  timestamp: string;
};

/** Processed detection data per node */
export type TimeseriesData = {
  prediction_label: string;
  node: string;
  isDrone: boolean;
  detection_label: string;
  timestamp: string;
  original_data: NodeRawData;
};

/** Gateway coordinate config from Firebase gateway/ */
export type GatewayConfig = {
  lat: number;
  lon: number;
  nodes: Record<string, NodeCoord>;
};

/** Single node coordinate */
export type NodeCoord = {
  lat: number;
  lon: number;
};

/** RF coverage status: only 2 states */
export type RfStatus = "safe" | "critical";