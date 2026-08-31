import { requestJson } from '@/lib/api';
import type { CurrentBirthInput } from '../birthInputStorage';

export type DailyTransit = { title: string; area: string; text: string };
export type DailyTransitsResponse = { date?: string; transits: DailyTransit[]; cached?: boolean };

export async function getDailyTransits(profile: CurrentBirthInput) {
  const result = await requestJson<DailyTransitsResponse>('/api/astrology-tools/transits', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ birth_date: profile.birth_date, birth_time: profile.birth_time, birth_time_unknown: false, birth_place: profile.birth_place }),
  });
  if (!Array.isArray(result.transits) || result.transits.length === 0) throw new Error('response');
  return result;
}
