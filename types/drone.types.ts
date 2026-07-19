// ============================================================
// Central type definitions for the drone detection dashboard
// ============================================================

/** Raw data shape coming from Firebase Timeseries/{NodeX} */
export type NodeRawData = {
  data_hex: string;
  node: string;
  prediction: string; // "Aman" | "Drone Terdeteksi"
  rssi: number;
  snr: number;
  timestamp: string;
};

/** Processed prediction data per node */
export type TimeseriesData = {
  node: string;
  isDrone: boolean;
  prediction_label: string;
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
