import { requestJson } from '@/lib/api';

export type MoonCalendarPhase = {
  id: 'new_moon' | 'first_quarter' | 'full_moon' | 'last_quarter';
  label: string;
  instant: string;
  sign: string;
  meaning: string;
};

export type MoonCalendarResponse = {
  calendar: {
    month: string;
    timezone: string;
    calculationVersion: string;
    phases: MoonCalendarPhase[];
    today: {
      phase: string;
      sign: string;
      illumination: number;
      nextPhase: { label: string; instant: string; daysRemaining: number } | null;
    };
  };
};

export async function getMoonCalendar(month: string) {
  const response = await requestJson<MoonCalendarResponse>(`/api/astrology-tools/moon?month=${encodeURIComponent(month)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!response.calendar || !Array.isArray(response.calendar.phases)) throw new Error('response');
  return response;
}
