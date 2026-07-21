// ============================================================
// Central type definitions for the drone detection dashboard
// ============================================================

/**
 * Raw per-node data as actually written by the gateway backend (app.py).
 *
 * The backend splits the data across TWO Firebase paths:
 *  - `detection_system/{node1|node2|node3}` (lowercase keys): live raw frame
 *    data -> data_hex, rssi, snr, node, timestamp_wib, captured_at, plus the
 *    detection result (prediction_id / prediction_label / prediction_time).
 *  - `Timeseries/{Node1|Node2|Node3}` (capitalized keys): archive of the
 *    decision -> prediction + timestamp only.
 *
 * All fields are optional because a given node only carries the subset that
 * the source path provides at that moment.
 */
export type NodeRawData = {
  node?: string;
  data_hex?: string;
  rssi?: number;
  snr?: number;

  // detection_system fields
  timestamp_wib?: string;
  captured_at?: string;
  prediction_id?: number;
  prediction_label?: string;
  prediction_time?: string;

  // Timeseries fields
  prediction?: string; // "Aman" | "Drone Terdeteksi"
  timestamp?: string;
};

/** Processed prediction data per node (merged view of both Firebase paths) */
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
