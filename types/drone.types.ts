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

// ============================================================
// QoS monitoring types
// ============================================================

/** Raw QoS record written by backend to Firebase qos/live/{node} */
export type QosLiveRecord = {
  node: string;
  event: string; // "kalibrasi" | "deteksi"
  seq: number | null;
  rssi: number;
  snr: number;
  poll_rtt_ms: number | null; // RTT poll->reply diukur gateway (ms)
  node_proc_ms: number | null; // lama scan+proses di node (ms)
  link_delay_ms: number | null; // poll_rtt - node_proc (delay link LoRa)
  payload_len: number | null; // ukuran paket LoRa (byte)
  fb_raw_ms: number; // latency PATCH data mentah ke Firebase (ms)
  decision: string; // "" | "AMAN" | "DRONE"
  decision_ms: number | null; // lama komputasi keputusan di backend (ms)
  fb_pred_ms: number | null; // latency PATCH hasil keputusan (ms)
  backend_rx_at: number; // epoch ms (jam laptop backend) frame tiba
  backend_sent_at: number; // epoch ms (jam laptop backend) selesai proses
  server_ts: number; // jam server Firebase saat record tertulis
  rx_count: number;
  timeout_count: number;
  loss_pct: number;
};

/** One processed QoS sample with per-segment latencies (computed client-side) */
export type QosSample = {
  node: string;
  seq: number | null;
  event: string;
  rssi: number;
  snr: number;
  pollRttMs: number | null; // Segmen 1: Node -> Gateway (RTT)
  nodeProcMs: number | null;
  linkDelayMs: number | null;
  decision: string;
  decisionMs: number | null; // Segmen 2: komputasi keputusan backend
  backendProcMs: number; // Segmen 2: total waktu proses backend/frame
  fbRawMs: number;
  backendToFbMs: number | null; // Segmen 3: Backend -> Firebase (one-way, jam server)
  fbToFeMs: number; // Segmen 4: Firebase -> Frontend (one-way, jam server)
  e2eMs: number | null; // End-to-end: poll gateway -> tampil di browser
  lossPct: number;
  arrivedAtServer: number; // epoch ms (jam server) saat sampel tiba di browser
};

/** Aggregate statistics for one metric */
export type QosMetricStats = {
  count: number;
  mean: number;
  min: number;
  max: number;
  stdev: number;
  jitter: number; // rata-rata |selisih delay berurutan| (variasi delay)
};
