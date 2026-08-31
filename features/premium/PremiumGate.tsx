import type { PropsWithChildren, ReactNode } from 'react';

import { DEFAULT_ENTITLEMENT, hasPremiumAccess } from './entitlements';
import type { Entitlement, PremiumFeature } from '@/types/entitlement';

type PremiumGateProps = PropsWithChildren<{
  entitlement?: Entitlement;
  feature?: PremiumFeature;
  fallback?: ReactNode;
}>;

export function PremiumGate({
  children,
  entitlement = DEFAULT_ENTITLEMENT,
  feature,
  fallback = null,
}: PremiumGateProps) {
  return hasPremiumAccess(entitlement, feature) ? children : fallback;
}
