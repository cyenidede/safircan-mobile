import { requestJson } from '@/lib/api';
import type { CurrentBirthInput } from '../birthInputStorage';

export type WeeklyTransit = {
  title: string;
  transitPlanet: string;
  natalPlanet: string;
  aspectType: string;
  natalHouse: number | null;
  category: string;
  startTime: string | null;
  exactTime: string | null;
  endTime: string | null;
};

export type BeautyTimingDay = {
  date: string;
  moonSign: string;
  moonPhase: string;
  illumination: number;
  labels: string[];
};

export type WeeklyTransitsResponse = {
  startDate: string | null;
  endDate: string | null;
  natalAscendant: string | null;
  transits: WeeklyTransit[];
  beautyTiming: BeautyTimingDay[];
  cached?: boolean;
};

export async function getWeeklyTransits(
  profile: CurrentBirthInput,
): Promise<WeeklyTransitsResponse> {
  const result = await requestJson<WeeklyTransitsResponse>(
    '/api/astrology-tools/transits/weekly',
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

  if (!Array.isArray(result.transits) || result.transits.length === 0) {
    throw new Error('response');
  }

  return result;
}