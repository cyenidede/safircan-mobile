const API_BASE_URL = 'https://safircan.com';
const DEFAULT_TIMEOUT_MS = 20_000;

export class ApiRequestError extends Error {
  constructor(public readonly kind: 'place' | 'network' | 'response' | 'unauthorized' | 'forbidden', public readonly status?: number) {
    super(kind);
  }
}

export async function requestJson<T>(path: string, init: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { ...init, signal: controller.signal });
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new ApiRequestError('response');
    }
    if (!response.ok) {
      const kind = response.status === 401 ? 'unauthorized' : response.status === 403 ? 'forbidden' : response.status === 422 ? 'place' : 'response';
      throw new ApiRequestError(kind, response.status);
    }
    return data as T;
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    throw new ApiRequestError('network');
  } finally {
    clearTimeout(timeout);
  }
}
