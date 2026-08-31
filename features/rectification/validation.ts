import type { ApproximateDateValue, RectificationDraft, RectificationEvent } from './types';

export function formatExactDateInput(input: string) {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function isValidCalendarDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return false;
  const day = Number(match[1]); const month = Number(match[2]); const year = Number(match[3]);
  if (year < 1900 || year > new Date().getFullYear() || month < 1 || month > 12 || day < 1) return false;
  return day <= new Date(year, month, 0).getDate();
}

export function approximateDateError(value: ApproximateDateValue) {
  if (value.precision === 'unknown' || value.precision === 'not-applicable') return null;
  if (value.precision === 'exact') return isValidCalendarDate(value.value) ? null : 'Geçerli bir tarih gir.';
  if (value.precision === 'month-year') {
    const match = /^(\d{2})\/(\d{4})$/.exec(value.value);
    return match && Number(match[1]) >= 1 && Number(match[1]) <= 12 && Number(match[2]) >= 1900 ? null : 'Geçerli bir ay ve yıl gir.';
  }
  return /^\d{4}$/.test(value.value) && Number(value.value) >= 1900 ? null : 'Geçerli bir yıl gir.';
}

export type DraftValidation = { firstStep: number | null; fields: Record<string, string> };
export function validateRectificationDraft(draft: RectificationDraft): DraftValidation {
  const fields: Record<string, string> = {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.birth.date)) fields.birth_date = draft.birth.date ? 'Geçerli bir tarih gir.' : 'Doğum tarihi zorunludur.';
  if (!draft.birth.city.trim()) fields.birth_city = 'Doğum yeri / il zorunludur.';
  if (draft.birth.knownTimePeriod === 'Yaklaşık saat aralığı biliyorum') {
    const validTime = (value: string) => { const match = /^(\d{2}):(\d{2})$/.exec(value); return Boolean(match && Number(match[1]) <= 23 && Number(match[2]) <= 59); };
    if (!validTime(draft.birth.knownTimeStart) || !validTime(draft.birth.knownTimeEnd)) fields.known_time_range = 'Lütfen doğum saati aralığını tamamla.';
    else if (draft.birth.knownTimeStart > draft.birth.knownTimeEnd) fields.known_time_range = 'Başlangıç saati bitiş saatinden sonra olamaz.';
  }
  const checkDate = (value: ApproximateDateValue, step: number, key: string) => { const error = approximateDateError(value); if (error) fields[`${step}:${key}`] = error; };
  const checkEvents = (events: RectificationEvent[], step: number, prefix: string) => events.forEach((event, index) => { checkDate(event.date, step, `${prefix}.${index}.date`); if (event.endDate && !event.ongoing) checkDate(event.endDate, step, `${prefix}.${index}.endDate`); });
  checkDate(draft.education.primaryStart, 3, 'primaryStart'); checkDate(draft.education.highSchoolStart, 3, 'highSchoolStart'); checkDate(draft.education.highSchoolGraduation, 3, 'highSchoolGraduation');
  if (!draft.education.noUniversity) { checkDate(draft.education.universityStart, 3, 'universityStart'); if (!draft.education.universityOngoing) checkDate(draft.education.universityGraduation, 3, 'universityGraduation'); }
  checkEvents(draft.family.events, 2, 'family'); checkEvents(draft.education.events, 3, 'education'); checkEvents(draft.moves.events, 4, 'moves'); checkDate(draft.career.firstJob, 5, 'firstJob'); checkEvents(draft.career.jobs, 5, 'jobs'); checkEvents(draft.career.events, 5, 'career');
  Object.entries(draft.relationships.dates).forEach(([key, value]) => checkDate(value, 6, key)); checkEvents(draft.relationships.events, 6, 'relationships'); checkEvents(draft.relationships.children, 6, 'children'); if (draft.relationships.includeReproductiveHealth) checkEvents(draft.relationships.reproductiveEvents, 6, 'reproductive');
  if (draft.majorEvents.includeHealth) checkEvents(draft.majorEvents.healthEvents, 7, 'health'); if (draft.majorEvents.includeLegal) checkEvents(draft.majorEvents.legalEvents, 7, 'legal'); checkEvents(draft.finance.events, 8, 'finance');
  const firstStep = Object.keys(fields).reduce<number | null>((first, key) => { const step = key === 'birth_date' || key === 'birth_city' || key === 'known_time_range' ? 1 : Number(key.split(':')[0]); return first === null || step < first ? step : first; }, null);
  return { firstStep, fields };
}
