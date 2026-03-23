/**
 * Build WebSocket URL for list sync (Phase 4 backend).
 * Defaults: derive ws/wss from VITE_API_BASE_URL when VITE_WS_BASE_URL is unset.
 */
export function getWsOrigin(): string {
  const explicit = import.meta.env.VITE_WS_BASE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }
  const api = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8000';
  try {
    const u = new URL(api);
    const protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${u.host}`;
  } catch {
    return 'ws://localhost:8000';
  }
}

export function buildListWebSocketUrl(listId: string, userId: string): string {
  const origin = getWsOrigin();
  return `${origin}/ws/lists/${encodeURIComponent(listId)}/?user_id=${encodeURIComponent(userId)}`;
}
