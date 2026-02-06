export type GatewayData = {
  lat: string;
  lon: string;
  network: string;
};

export type NodeData = {
  Packet: string;
  RSSI: string;
  bat: string;
  lat: string;
  lon: string;
  threat: number;
  time: string;
};

export type NodesMap = Record<string, NodeData>;
