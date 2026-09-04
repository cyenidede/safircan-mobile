import { isQuestionCategory, isQuestionStatus, type QuestionCategory, type QuestionStatus } from './domain';

const API_BASE_URL = 'https://safircan.com';
export type CatalogQuestion = { id: string; category: QuestionCategory; title: string; requiresBirthTime: boolean; starCost: number; sortOrder: number };
export type QuestionAnswer = { directAnswer: string | null; detail: string | null; timing: string | null; caution: string | null; conclusion: string | null };
export type UserQuestion = { id: string; title: string; status: QuestionStatus; starCost: number; createdAt: string; answer: QuestionAnswer | null };
export class QuestionsApiError extends Error { constructor(public readonly status: number, public readonly code?: string) { super(code || 'questions_error'); } }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }
function stringOrNull(value: unknown) { return typeof value === 'string' && value.trim() ? value : null; }
function normalizeAnswer(value: unknown): QuestionAnswer | null {
  if (!isRecord(value)) return null;
  const source = isRecord(value.answer) ? value.answer : value;
  const answer = { directAnswer: stringOrNull(source.directAnswer ?? source.direct_answer), detail: stringOrNull(source.detail), timing: stringOrNull(source.timing), caution: stringOrNull(source.caution), conclusion: stringOrNull(source.conclusion) };
  return Object.values(answer).some(Boolean) ? answer : null;
}
export function normalizeCatalog(value: unknown): CatalogQuestion[] {
  const items = isRecord(value) && Array.isArray(value.items) ? value.items : [];
  return items.flatMap((item): CatalogQuestion[] => {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.title !== 'string' || !isQuestionCategory(item.category) || typeof item.starCost !== 'number') return [];
    return [{ id: item.id, category: item.category, title: item.title, requiresBirthTime: item.requiresBirthTime === true, starCost: item.starCost, sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : 0 }];
  }).sort((left, right) => left.sortOrder - right.sortOrder);
}
export function normalizeQuestion(value: unknown, fallbackTitle = ''): UserQuestion | null {
  if (!isRecord(value)) return null;
  const source = isRecord(value.question) ? value.question : value;
  const id = typeof source.id === 'string' ? source.id : typeof source.questionId === 'string' ? source.questionId : '';
  const title = typeof source.title === 'string' ? source.title : typeof source.question === 'string' ? source.question : fallbackTitle;
  if (!id || !title || !isQuestionStatus(source.status)) return null;
  return { id, title, status: source.status, starCost: typeof source.starCost === 'number' ? source.starCost : typeof source.star_cost === 'number' ? source.star_cost : 0, createdAt: typeof source.createdAt === 'string' ? source.createdAt : typeof source.created_at === 'string' ? source.created_at : '', answer: normalizeAnswer(source) };
}
async function request<T>(path: string, token?: string, init?: RequestInit, timeoutMs = 20_000) {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers }, signal: controller.signal });
    const data = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok || data.success === false) {
      const code = typeof data.code === 'string' ? data.code : typeof data.error === 'string' ? data.error : typeof data.failureCode === 'string' ? data.failureCode : typeof data.failure_code === 'string' ? data.failure_code : undefined;
      throw new QuestionsApiError(response.status, code);
    }
    return data as T;
  } catch (error) { if (error instanceof QuestionsApiError) throw error; throw new QuestionsApiError(0, 'network_error'); }
  finally { clearTimeout(timeout); }
}
export async function getQuestionCatalog() { return normalizeCatalog(await request<unknown>('/api/questions/catalog')); }
export async function getStarsBalance(token: string) {
  const data = await request<Record<string, unknown>>('/api/stars/balance', token); const nested = isRecord(data.wallet) ? data.wallet : data; const balance = isRecord(nested.balance) ? nested.balance : nested; const value = typeof nested.balance === 'number' ? nested.balance : balance.available ?? balance.balance ?? balance.stars ?? balance.starBalance;
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new QuestionsApiError(200, 'invalid_balance');
  return Math.max(0, Math.trunc(value));
}
export async function getQuestions(token: string) {
  const data = await request<unknown>('/api/questions', token); const items = isRecord(data) && Array.isArray(data.items) ? data.items : isRecord(data) && Array.isArray(data.questions) ? data.questions : [];
  return items.flatMap((item) => { const normalized = normalizeQuestion(item); return normalized ? [normalized] : []; });
}
export async function getQuestion(token: string, id: string) { const item = normalizeQuestion(await request<unknown>(`/api/questions/${encodeURIComponent(id)}`, token)); if (!item) throw new QuestionsApiError(200, 'invalid_question'); return item; }
export type SubmitQuestionInput = { clientRequestId: string; catalogId: string } | { clientRequestId: string; customQuestion: string };
export async function submitQuestion(token: string, input: SubmitQuestionInput, displayTitle: string) { const item = normalizeQuestion(await request<unknown>('/api/questions', token, { method: 'POST', body: JSON.stringify(input) }, 30_000), displayTitle); if (!item) throw new QuestionsApiError(200, 'invalid_question'); return item; }
