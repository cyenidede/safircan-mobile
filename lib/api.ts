export const API_BASE_URL = 'https://safircan.com';
const DEFAULT_TIMEOUT_MS = 20_000;
export type ApiResponseDiagnostic = { url: string; status: number; data: unknown };

export class ApiRequestError extends Error {
  constructor(public readonly kind: 'place' | 'network' | 'response' | 'unauthorized' | 'forbidden', public readonly status?: number) {
    super(kind);
  }
}

export async function requestJson<T>(path: string, init: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS, onResponse?: (diagnostic: ApiResponseDiagnostic) => void) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const url = `${API_BASE_URL}${path}`;
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      onResponse?.({ url, status: response.status, data: null });
      throw new ApiRequestError('response');
    }
    onResponse?.({ url, status: response.status, data });
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
