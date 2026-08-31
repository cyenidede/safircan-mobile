import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import type { AstrologyChartResult, NatalChartRequest } from './api/types';

type AstrologyChartContextValue = {
  result: AstrologyChartResult | null;
  setResult: (result: AstrologyChartResult | null) => void;
  request: NatalChartRequest | null;
  setRequest: (request: NatalChartRequest | null) => void;
};

const AstrologyChartContext = createContext<AstrologyChartContextValue | null>(null);

export function AstrologyChartProvider({ children }: PropsWithChildren) {
  const [result, setResult] = useState<AstrologyChartResult | null>(null);
  const [request, setRequest] = useState<NatalChartRequest | null>(null);
  const value = useMemo(() => ({ result, setResult, request, setRequest }), [request, result]);
  return <AstrologyChartContext.Provider value={value}>{children}</AstrologyChartContext.Provider>;
}

export function useAstrologyChart() {
  const context = useContext(AstrologyChartContext);
  if (!context) throw new Error('useAstrologyChart must be used within AstrologyChartProvider');
  return context;
}
