export type PersonalizedKind = 'weekly' | 'monthly' | 'sky_answer';
export type PersonalizedStatus = 'preview_ready' | 'processing' | 'ready' | 'unavailable';
export type PersonalizedLocale = 'tr' | 'en';

export type StandardPreview = { headline: string; summary: string };
export type SkyPreview = { headline: string; hint: string };
export type WeeklyResult = {
  preview: StandardPreview;
  overview: string;
  mainTheme: { title: string; detail: string };
  relationships?: string;
  workAndMoney?: string;
  attention?: string;
  importantDates: Array<{ startDate: string; endDate?: string; label: string; guidance: string }>;
  closing: string;
};
export type MonthlyResult = {
  preview: StandardPreview;
  overview: string;
  mainThemes: Array<{ title: string; detail: string }>;
  relationships?: string;
  careerAndMoney?: string;
  attention?: string;
  importantWindows: Array<{ startDate: string; endDate?: string; title: string; guidance: string }>;
  closing: string;
};
export type SkyAnswerResult = {
  preview: SkyPreview;
  full: {
    theme: string;
    answer: string;
    whyNow: string;
    focus: string;
    caution?: string;
    timeWindow?: { startDate: string; endDate?: string; label: string };
  };
};
export type PersonalizedFullResult = WeeklyResult | MonthlyResult | SkyAnswerResult;
export type PersonalizedContent = {
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  timezone: string;
  locale: PersonalizedLocale;
  state: PersonalizedStatus;
  preview: StandardPreview | SkyPreview;
  fullResult?: PersonalizedFullResult;
};
export type PersonalizedCurrent = {
  success: true;
  kind: PersonalizedKind;
  status: PersonalizedStatus;
  access: { unlocked: boolean };
  content: PersonalizedContent;
};

const kinds = new Set<PersonalizedKind>(['weekly', 'monthly', 'sky_answer']);
const statuses = new Set<PersonalizedStatus>(['preview_ready', 'processing', 'ready', 'unavailable']);
const locales = new Set<PersonalizedLocale>(['tr', 'en']);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(value: Record<string, unknown>, required: readonly string[], optional: readonly string[] = []) {
  const allowed = new Set([...required, ...optional]);
  return required.every((key) => Object.hasOwn(value, key)) && Object.keys(value).every((key) => allowed.has(key));
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function optionalText(value: Record<string, unknown>, key: string) {
  return !Object.hasOwn(value, key) || isText(value[key]);
}

function isStandardPreview(value: unknown): value is StandardPreview {
  return isPlainObject(value) && hasExactKeys(value, ['headline', 'summary']) && isText(value.headline) && isText(value.summary);
}

function isSkyPreview(value: unknown): value is SkyPreview {
  return isPlainObject(value) && hasExactKeys(value, ['headline', 'hint']) && isText(value.headline) && isText(value.hint);
}

function isTitleDetail(value: unknown) {
  return isPlainObject(value) && hasExactKeys(value, ['title', 'detail']) && isText(value.title) && isText(value.detail);
}

function isWeeklyDate(value: unknown) {
  return isPlainObject(value) && hasExactKeys(value, ['startDate', 'label', 'guidance'], ['endDate']) &&
    isText(value.startDate) && optionalText(value, 'endDate') && isText(value.label) && isText(value.guidance);
}

function isMonthlyWindow(value: unknown) {
  return isPlainObject(value) && hasExactKeys(value, ['startDate', 'title', 'guidance'], ['endDate']) &&
    isText(value.startDate) && optionalText(value, 'endDate') && isText(value.title) && isText(value.guidance);
}

export function isWeeklyResult(value: unknown): value is WeeklyResult {
  return isPlainObject(value) &&
    hasExactKeys(value, ['preview', 'overview', 'mainTheme', 'importantDates', 'closing'], ['relationships', 'workAndMoney', 'attention']) &&
    isStandardPreview(value.preview) && isText(value.overview) && isTitleDetail(value.mainTheme) &&
    optionalText(value, 'relationships') && optionalText(value, 'workAndMoney') && optionalText(value, 'attention') &&
    Array.isArray(value.importantDates) && value.importantDates.every(isWeeklyDate) && isText(value.closing);
}

export function isMonthlyResult(value: unknown): value is MonthlyResult {
  return isPlainObject(value) &&
    hasExactKeys(value, ['preview', 'overview', 'mainThemes', 'importantWindows', 'closing'], ['relationships', 'careerAndMoney', 'attention']) &&
    isStandardPreview(value.preview) && isText(value.overview) && Array.isArray(value.mainThemes) && value.mainThemes.every(isTitleDetail) &&
    optionalText(value, 'relationships') && optionalText(value, 'careerAndMoney') && optionalText(value, 'attention') &&
    Array.isArray(value.importantWindows) && value.importantWindows.every(isMonthlyWindow) && isText(value.closing);
}

function isTimeWindow(value: unknown) {
  return isPlainObject(value) && hasExactKeys(value, ['startDate', 'label'], ['endDate']) &&
    isText(value.startDate) && optionalText(value, 'endDate') && isText(value.label);
}

export function isSkyAnswerResult(value: unknown): value is SkyAnswerResult {
  if (!isPlainObject(value) || !hasExactKeys(value, ['preview', 'full']) || !isSkyPreview(value.preview) || !isPlainObject(value.full)) return false;
  const full = value.full;
  return hasExactKeys(full, ['theme', 'answer', 'whyNow', 'focus'], ['caution', 'timeWindow']) &&
    isText(full.theme) && isText(full.answer) && isText(full.whyNow) && isText(full.focus) && optionalText(full, 'caution') &&
    (!Object.hasOwn(full, 'timeWindow') || isTimeWindow(full.timeWindow));
}

export function parsePersonalizedCurrent(value: unknown): PersonalizedCurrent {
  if (!isPlainObject(value) || !hasExactKeys(value, ['success', 'kind', 'status', 'access', 'content']) || value.success !== true ||
      !kinds.has(value.kind as PersonalizedKind) || !statuses.has(value.status as PersonalizedStatus) ||
      !isPlainObject(value.access) || !hasExactKeys(value.access, ['unlocked']) || typeof value.access.unlocked !== 'boolean' ||
      !isPlainObject(value.content) || !hasExactKeys(value.content, ['periodKey', 'periodStart', 'periodEnd', 'timezone', 'locale', 'state', 'preview'], ['fullResult'])) {
    throw new Error('invalid_personalized_response');
  }
  const kind = value.kind as PersonalizedKind;
  const status = value.status as PersonalizedStatus;
  const content = value.content;
  const unlocked = value.access.unlocked;
  const validPreview = kind === 'sky_answer' ? isSkyPreview(content.preview) : isStandardPreview(content.preview);
  if (!isText(content.periodKey) || !isText(content.periodStart) || !isText(content.periodEnd) || !isText(content.timezone) ||
      !locales.has(content.locale as PersonalizedLocale) || content.state !== status || !validPreview) throw new Error('invalid_personalized_response');
  const hasFullResult = Object.hasOwn(content, 'fullResult');
  if (status === 'ready') {
    const validFullResult = kind === 'weekly' ? isWeeklyResult(content.fullResult) : kind === 'monthly' ? isMonthlyResult(content.fullResult) : isSkyAnswerResult(content.fullResult);
    if (!unlocked || !hasFullResult || !validFullResult) throw new Error('invalid_personalized_response');
  } else if (hasFullResult || ((status === 'processing' || status === 'unavailable') && !unlocked)) {
    throw new Error('invalid_personalized_response');
  }
  return value as unknown as PersonalizedCurrent;
}

export const PERSONALIZED_POLL_DELAY_MS = 10_000;
export const PERSONALIZED_POLL_WINDOW_MS = 120_000;
export const PERSONALIZED_MAX_POLLS = 12;

export function shouldPollPersonalized(value: PersonalizedCurrent | null | undefined) {
  return value?.status === 'processing' && value.access.unlocked === true;
}

export function createPersonalizedPollingGate(now: () => number = Date.now) {
  let startedAt: number | null = null;
  let polls = 0;
  let scheduled = false;
  return {
    begin(result: PersonalizedCurrent) {
      if (!shouldPollPersonalized(result) || scheduled) return false;
      if (startedAt === null) startedAt = now();
      if (polls >= PERSONALIZED_MAX_POLLS || now() - startedAt >= PERSONALIZED_POLL_WINDOW_MS) return false;
      scheduled = true;
      return true;
    },
    consume() { if (!scheduled) return false; scheduled = false; polls += 1; return true; },
    cancel() { scheduled = false; startedAt = null; polls = 0; },
    snapshot() { return { polls, scheduled, startedAt }; },
  };
}
