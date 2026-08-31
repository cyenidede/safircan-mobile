export type NatalPlanet = {
  name: string;
  sign: string;
  degree: number;
  house: number | null;
  retrograde: boolean;
};

export type FreeNatalPlanet = Omit<NatalPlanet, 'house'>;

export type FreeNatalChart = {
  sun: FreeNatalPlanet;
  moon: FreeNatalPlanet;
  ascendant: FreeNatalPlanet | null;
  mercury: FreeNatalPlanet;
  venus: FreeNatalPlanet;
  mars: FreeNatalPlanet;
};

export type NatalChartResponse = {
  success: true;
  chart: FreeNatalChart;
  warning: string | null;
};

export type SunOnlyChartResult = {
  success: true;
  mode: 'sun-only';
  birthTimeKnown: false;
  birthDate: string;
  birthPlace: string;
  sun: { sign: string } | null;
  requiresBirthTime: boolean;
};

export type AstrologyChartResult = NatalChartResponse | SunOnlyChartResult;

export type NatalChartRequest = {
  birth_date: string;
  birth_time: string | null;
  birth_time_unknown: boolean;
  birthTimeKnown: boolean;
  birth_place: string;
};

export type PremiumModule = { id: string; category: 'self' | 'love' | 'career' | 'karmic' | 'technical' | 'forecast'; title: string; summary: string; indicators: string[]; detail: string; available: boolean };
export type PremiumReportAspect = { label: string; orb: number };
export type PremiumReportIndicator = { id: string; title: string; name: string; sign: string; house: number | null; degree: number; aspects: PremiumReportAspect[]; interpretation: string };
export type PremiumReportAnalysis = { id: string; title: string; text: string; indicators: string[]; featured?: boolean };
export type PremiumReport = { indicators: PremiumReportIndicator[]; character: PremiumReportAnalysis[]; natalQuestions: PremiumReportAnalysis[]; unavailable: string[]; metadata: { calculationVersion: string; partOfFortuneFormula: 'day_asc_moon_minus_sun' | 'night_asc_sun_minus_moon' } };
export type PremiumNatalResponse = {
  success: true;
  premium: {
    chart: { [key: string]: unknown };
    wheel: {
      houses: Array<{ id: number; sign: string; startDegree: number; endDegree: number }>;
      planets: NatalPlanet[];
      angles: Record<'asc' | 'dsc' | 'mc' | 'ic', { id: number; sign: string; startDegree: number; endDegree: number }>;
      aspects: Array<{ from: string; to: string; type: string; orb: number }>;
    };
    distributions: { dominantElement: string; dominantModality: string };
    report: PremiumReport;
    modules: PremiumModule[];
    unavailable: string[];
  };
};
