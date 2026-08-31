import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { hasEntitlement as entitlementSatisfies } from '@/features/premium/entitlements';
import type { Entitlement } from '@/types/entitlement';

type EntitlementContextValue = { entitlements: readonly Entitlement[]; loading: boolean; refreshEntitlements: () => Promise<void>; hasEntitlement: (required: Entitlement) => boolean };
const EntitlementContext = createContext<EntitlementContextValue | null>(null);
const productIds: readonly Entitlement[] = ['annual_forecast', 'full_chart', 'birth_time_rectification', 'synastry'];

export function EntitlementProvider({ children }: PropsWithChildren) {
  const { loading: authLoading, session } = useAuth();
  const [entitlements, setEntitlements] = useState<readonly Entitlement[]>(['free']);
  const [loading, setLoading] = useState(true);

  const refreshEntitlements = async () => {
    if (!session?.access_token) { setEntitlements(['free']); setLoading(false); return; }
    setLoading(true);
    await fetch('https://safircan.com/api/entitlements', { headers: { Accept: 'application/json', Authorization: `Bearer ${session.access_token}` } })
      .then(async (response) => { const data = await response.json() as { success?: boolean; entitlements?: unknown[] }; if (!response.ok || !data.success) throw new Error('entitlements'); return (data.entitlements ?? []).filter((item): item is Entitlement => typeof item === 'string' && productIds.includes(item as Entitlement)); })
      .then((verified) => setEntitlements(['free', ...verified]))
      .catch(() => setEntitlements(['free']))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authLoading) return;
    void refreshEntitlements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, session?.access_token]);

  const value = useMemo<EntitlementContextValue>(() => ({ entitlements, loading, refreshEntitlements, hasEntitlement: (required) => entitlements.some((current) => entitlementSatisfies(current, required)) }), [entitlements, loading, session?.access_token]);
  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>;
}

export function useEntitlements() { const context = useContext(EntitlementContext); if (!context) throw new Error('useEntitlements must be used inside EntitlementProvider'); return context; }
