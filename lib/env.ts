/**
 * Mobil istemci yalnızca herkese açık yapılandırma değerlerini kullanmalıdır.
 * Sunucu tokenları ve servis secret'ları safircan.com backend'inde tutulur.
 */
export const publicConfig = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://safircan.com/api',
} as const;
