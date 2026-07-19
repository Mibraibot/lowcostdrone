// ============================================================
// Geo utilities: reverse geocoding, center calculations
// ============================================================

import type { NodeCoord } from "@/types/drone.types";

// In-memory cache for reverse geocode results
const geocodeCache = new Map<string, string>();

/**
 * Reverse geocode lat/lon to a human-readable address via Nominatim.
 * Results are cached in memory.
 */
export async function reverseGeocode(lat: number | string, lon: number | string): Promise<string> {
  const numLat = Number(lat) || 0;
  const numLon = Number(lon) || 0;
  const key = `${numLat.toFixed(6)},${numLon.toFixed(6)}`;

  if (geocodeCache.has(key)) return geocodeCache.get(key)!;

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(numLat));
  url.searchParams.set("lon", String(numLon));
  url.searchParams.set("zoom", "14");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), { method: "GET" });
  if (!res.ok) throw new Error(`Reverse geocode failed: ${res.status}`);

  const data = await res.json();
  const addr =
    data?.display_name ||
    [
      data?.address?.city,
      data?.address?.town,
      data?.address?.village,
      data?.address?.state,
      data?.address?.country_code?.toUpperCase(),
    ]
      .filter(Boolean)
      .join(", ") ||
    "Alamat tidak ditemukan";

  geocodeCache.set(key, addr);
  return addr;
}

/**
 * Format lat/lon pair to a display string with 4 decimal places.
 */
export function formatCoord(lat: number | string, lon: number | string): string {
  return `${(Number(lat) || 0).toFixed(4)}, ${(Number(lon) || 0).toFixed(4)}`;
}

/**
 * Compute the center point of all nodes (excludes gateway).
 */
export function computeNodesCenter(
  nodes: Record<string, NodeCoord>,
  fallback: [number, number]
): [number, number] {
  let sumLat = 0;
  let sumLon = 0;
  let count = 0;

  Object.values(nodes).forEach((node) => {
    const lat = Number(node.lat);
    const lon = Number(node.lon);
    if (!isNaN(lat) && !isNaN(lon)) {
      sumLat += lat;
      sumLon += lon;
      count++;
    }
  });

  if (count === 0) return fallback;
  return [sumLat / count, sumLon / count];
}

/**
 * Compute fleet center: average of gateway position + all node positions.
 */
export function computeFleetCenter(
  gatewayCoord: [number, number],
  nodes: Record<string, NodeCoord> | undefined
): [number, number] {
  let sumLat = gatewayCoord[0];
  let sumLon = gatewayCoord[1];
  let count = 1;

  if (nodes) {
    Object.values(nodes).forEach((node) => {
      const lat = Number(node.lat);
      const lon = Number(node.lon);
      if (!isNaN(lat) && !isNaN(lon)) {
        sumLat += lat;
        sumLon += lon;
        count++;
      }
    });
  }

  return [sumLat / count, sumLon / count];
}
