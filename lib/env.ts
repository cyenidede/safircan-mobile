/**
 * Mobil istemci yalnızca herkese açık yapılandırma değerlerini kullanmalıdır.
 * Sunucu tokenları ve servis secret'ları safircan.com backend'inde tutulur.
 */
const PRODUCTION_API_BASE_URL = 'https://safircan.com';
const configurationError = 'invalid_api_base_url';

export function resolveApiBaseUrl(rawValue: string | undefined): string {
  const value = rawValue?.trim();
  if (!value) return PRODUCTION_API_BASE_URL;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(configurationError);
  }

  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || (url.pathname !== '' && url.pathname !== '/')) {
    throw new Error(configurationError);
  }

  return url.origin;
}

export const publicConfig = {
  apiBaseUrl: resolveApiBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL),
} as const;
