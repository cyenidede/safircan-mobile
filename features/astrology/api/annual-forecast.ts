import { requestJson } from '@/lib/api';
import type { NatalChartRequest } from './types';
export type ForecastMonth = { id: string; label: string; mainTheme: string; sections: Array<{ id: string; title: string; text: string }>; opportunity: string | null; attention: string | null; importantDates: Array<{ date: string; title: string; orb: number }> };
export type ForecastQuestion = { id: string; title: string; answer: string; period: string | null; indicators: string[] };
export type AnnualForecast = { calculationVersion: string; forecastStart: string; forecastEnd: string; summary: { love: string; career: string; money: string; change: string }; questions?: ForecastQuestion[]; months: ForecastMonth[] };
export function getAnnualForecast(input: NatalChartRequest, accessToken: string) { return requestJson<{ success: true; forecast: AnnualForecast; cached: boolean }>('/api/annual-forecast', { method: 'POST', headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(input) }, 45_000); }
