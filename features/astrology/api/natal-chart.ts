import { ApiRequestError, requestJson } from '@/lib/api';
import type { NatalChartRequest, NatalChartResponse } from './types';

export type NatalChartClientError = 'place' | 'temporary';

export async function createNatalChart(input: NatalChartRequest) {
  try {
    const result = await requestJson<NatalChartResponse>('/api/natal-chart?view=mobile-free', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!result.success || !result.chart?.sun || !result.chart?.moon) throw new ApiRequestError('response');
    return result;
  } catch (error) {
    const kind: NatalChartClientError = error instanceof ApiRequestError && error.kind === 'place' ? 'place' : 'temporary';
    throw new Error(kind);
  }
}
