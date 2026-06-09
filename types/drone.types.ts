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
};

export type NodesMap = Record<string, NodeData>;
