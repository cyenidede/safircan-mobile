import { requestJson } from '@/lib/api';
import { parsePersonalizedCurrent, type PersonalizedCurrent, type PersonalizedKind, type PersonalizedLocale } from './domain';

export async function getPersonalizedCurrent(kind: PersonalizedKind, locale: PersonalizedLocale, accessToken: string, signal?: AbortSignal): Promise<PersonalizedCurrent> {
  const query = `kind=${encodeURIComponent(kind)}&locale=${encodeURIComponent(locale)}`;
  const value = await requestJson<unknown>(`/api/personalized/current?${query}`, {
    method: 'GET',
    headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
    signal,
  });
  return parsePersonalizedCurrent(value);
}
