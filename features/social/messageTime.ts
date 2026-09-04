export function normalizeMessageTimestamp(value: unknown, fallback?: unknown): string | null {
  for (const candidate of [value, fallback]) {
    if (typeof candidate !== 'string' || !candidate.trim()) continue;
    const timestamp = Date.parse(candidate);
    if (Number.isFinite(timestamp)) return new Date(timestamp).toISOString();
  }
  return null;
}

export function formatMessageTime(value: unknown): string | null {
  const normalized = normalizeMessageTimestamp(value);
  if (!normalized) return null;
  try {
    return new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(new Date(normalized));
  } catch {
    return null;
  }
}
