export type DatePrecision = 'exact' | 'month-year' | 'year' | 'approximate' | 'unknown' | 'not-applicable';
export type ApproximateDateValue = { precision: DatePrecision; value: string; isApproximate: boolean };
export type RectificationEvent = { id: string; type: string; date: ApproximateDateValue; endDate?: ApproximateDateValue; description: string; from?: string; to?: string; reason?: string; ongoing?: boolean };
export type RectificationDraft = {
  version: 1; status: 'draft' | 'submitted'; currentStep: number; updatedAt: string;
  birth: { date: string; city: string; district: string; detail: string; knownTimePeriod: string; knownTimeStart: string; knownTimeEnd: string; method: string; specialSituation: string; birthConditions: string[]; otherCondition: string };
  family: { none: boolean; events: RectificationEvent[] };
  education: { primaryStart: ApproximateDateValue; highSchoolStart: ApproximateDateValue; highSchoolGraduation: ApproximateDateValue; universityStart: ApproximateDateValue; universityGraduation: ApproximateDateValue; noUniversity: boolean; universityOngoing: boolean; events: RectificationEvent[] };
  moves: { none: boolean; events: RectificationEvent[] };
  career: { firstJob: ApproximateDateValue; neverWorked: boolean; jobs: RectificationEvent[]; events: RectificationEvent[] };
  relationships: { dates: Record<string, ApproximateDateValue>; events: RectificationEvent[]; hasChildren: boolean | null; children: RectificationEvent[]; includeReproductiveHealth: boolean; reproductiveEvents: RectificationEvent[] };
  majorEvents: { includeHealth: boolean; healthEvents: RectificationEvent[]; includeLegal: boolean; legalEvents: RectificationEvent[] };
  finance: { events: RectificationEvent[] };
  consent: boolean;
};
export const emptyApproximateDate = (): ApproximateDateValue => ({ precision: 'unknown', value: '', isApproximate: false });
export function createRectificationDraft(prefill?: { birthDate?: string; birthPlace?: string }): RectificationDraft {
  const [city = '', district = ''] = (prefill?.birthPlace ?? '').split(',').map((part) => part.trim());
  return { version: 1, status: 'draft', currentStep: 1, updatedAt: new Date().toISOString(), birth: { date: prefill?.birthDate ?? '', city, district, detail: '', knownTimePeriod: '', knownTimeStart: '', knownTimeEnd: '', method: '', specialSituation: '', birthConditions: [], otherCondition: '' }, family: { none: false, events: [] }, education: { primaryStart: emptyApproximateDate(), highSchoolStart: emptyApproximateDate(), highSchoolGraduation: emptyApproximateDate(), universityStart: emptyApproximateDate(), universityGraduation: emptyApproximateDate(), noUniversity: false, universityOngoing: false, events: [] }, moves: { none: false, events: [] }, career: { firstJob: emptyApproximateDate(), neverWorked: false, jobs: [], events: [] }, relationships: { dates: {}, events: [], hasChildren: null, children: [], includeReproductiveHealth: false, reproductiveEvents: [] }, majorEvents: { includeHealth: false, healthEvents: [], includeLegal: false, legalEvents: [] }, finance: { events: [] }, consent: false };
}
