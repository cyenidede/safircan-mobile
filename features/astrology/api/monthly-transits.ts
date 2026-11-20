import { requestJson } from '@/lib/api';
import type { CurrentBirthInput } from '../birthInputStorage';
import type {
  BeautyTimingDay,
  WeeklyTransit,
} from './weekly-transits';

export type MonthlyTransitsResponse = {
  startDate: string | null;
  endDate: string | null;
  natalAscendant: string | null;
  transits: WeeklyTransit[];
  beautyTiming: BeautyTimingDay[];
  cached?: boolean;
};

export async function getMonthlyTransits(
  profile: CurrentBirthInput,
): Promise<MonthlyTransitsResponse> {
  const result = await requestJson<MonthlyTransitsResponse>(
    '/api/astrology-tools/transits/monthly',
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        birth_date: profile.birth_date,
        birth_time: profile.birth_time?.slice(0, 5) ?? '',
        birth_time_unknown: false,
        birth_place: profile.birth_place,
      }),
    },
  );

  if (!Array.isArray(result.transits)) {
    throw new Error('response');
  }

  return result;
}