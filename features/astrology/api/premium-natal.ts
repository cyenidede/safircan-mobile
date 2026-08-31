import { requestJson } from '@/lib/api';
import type { NatalChartRequest, PremiumNatalResponse } from './types';

export function getPremiumNatal(input: NatalChartRequest, accessToken: string) {
  return requestJson<PremiumNatalResponse>('/api/natal-chart?view=mobile-premium', {
    method: 'POST',
    headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}
