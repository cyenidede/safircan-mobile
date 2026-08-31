import type { Entitlement, PremiumFeature } from '@/types/entitlement';

export const DEFAULT_ENTITLEMENT: Entitlement = 'free';

export const hasPremiumAccess = (
  entitlement: Entitlement,
  feature?: PremiumFeature,
) => {
  if (!feature) return false;
  if (feature === 'advanced-synastry') return entitlement === 'synastry';
  if (feature === 'yearly-forecast') return entitlement === 'annual_forecast' || entitlement === 'full_chart';
  return entitlement === 'full_chart';
};

export const hasEntitlement = (
  current: Entitlement,
  required: Entitlement,
) => {
  if (required === 'free') return true;
  if (required === 'birth_time_rectification') return current === 'birth_time_rectification';
  if (required === 'synastry') return current === 'synastry';
  if (current === 'full_chart') return required === 'full_chart' || required === 'annual_forecast';
  return current === required;
};
