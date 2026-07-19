// ============================================================
// Node connection status utility
// ============================================================

/** How long (ms) before a node is considered disconnected */
export const CONNECTION_TIMEOUT_MS = 40_000;

/**
 * Determine if a node is connected based on its last timestamp.
 * A node is "connected" if its timestamp is within CONNECTION_TIMEOUT_MS of `now`.
 */
export function isNodeConnected(timestamp: string | undefined, now: number): boolean {
  if (!timestamp) return false;

  // Firebase timestamps come as "2026-07-18 18:34:25" (space-separated)
  const parsed = new Date(timestamp.replace(" ", "T")).getTime();
  if (isNaN(parsed)) return false;

  return (now - parsed) < CONNECTION_TIMEOUT_MS;
}
