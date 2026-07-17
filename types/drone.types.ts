export type GatewayData = {
  lat: string;
  lon: string;
  network: string;
};

export type NodeData = {
  rssi: number;
  snr: number;
  data_hex: string;
  timestamp_wib: string;
  captured_at?: string;
  node?: string;
  // Hasil deteksi dari backend (Gateway_LCDD1/backend/app.py):
  // prediction_id 0 = AMAN, 1 = DRONE TERDETEKSI
  prediction_id?: number;
  prediction_label?: string;
  prediction_time?: string;
};

export type NodesMap = Record<string, NodeData>;
