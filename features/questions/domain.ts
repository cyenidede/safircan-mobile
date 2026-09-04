export const CUSTOM_QUESTION_MIN = 10;
export const CUSTOM_QUESTION_MAX = 500;

export type QuestionCategory = 'love_relationship' | 'career' | 'money' | 'life';
export type QuestionStatus = 'queued' | 'processing' | 'answered' | 'failed';

export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  love_relationship: 'Aşk & İlişkiler',
  career: 'İş & Kariyer',
  money: 'Para',
  life: 'Yaşam',
};

export const STATUS_LABELS: Record<QuestionStatus, string> = {
  queued: 'Sırada', processing: 'Hazırlanıyor', answered: 'Cevap Hazır', failed: 'Tamamlanamadı',
};

export function isQuestionCategory(value: unknown): value is QuestionCategory {
  return value === 'love_relationship' || value === 'career' || value === 'money' || value === 'life';
}
export function isQuestionStatus(value: unknown): value is QuestionStatus {
  return value === 'queued' || value === 'processing' || value === 'answered' || value === 'failed';
}
export function isVisibleQuestionStatus(status: QuestionStatus) {
  return status === 'queued' || status === 'processing' || status === 'answered';
}
export function customQuestionError(value: string) {
  if (value.trim().length < CUSTOM_QUESTION_MIN) return `Sorun en az ${CUSTOM_QUESTION_MIN} karakter olmalı.`;
  if (value.length > CUSTOM_QUESTION_MAX) return `Sorun en fazla ${CUSTOM_QUESTION_MAX} karakter olabilir.`;
  return null;
}
export function shouldPollQuestion(status: QuestionStatus, appState: string) {
  return appState === 'active' && (status === 'queued' || status === 'processing');
}
export function isSafeQuestionId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9_-]{7,127}$/i.test(value);
}
export function questionErrorMessage(code?: string, status?: number) {
  if (status === 401 || code === 'unauthorized') return 'Devam etmek için hesabına giriş yapman gerekiyor.';
  if (code === 'feature_unavailable' || status === 503) return 'Safir’e Sor çok yakında kullanıma açılıyor.';
  if (code === 'insufficient_stars') return 'Bu soru için yeterli Yıldızın bulunmuyor.';
  if (code === 'birth_profile_required' || code === 'profile_required') return 'Devam etmek için doğum bilgilerini tamamlaman gerekiyor.';
  if (code === 'birth_time_required') return 'Bu soru için doğum saatine ihtiyacımız var.';
  if (code === 'safety_rejected' || code === 'unsupported_intent') return 'Bu soruyu bu formatta yorumlayamıyorum. Sorunu ilişki, kariyer, para veya yaşamındaki gelişmeler üzerinden yeniden yazabilirsin.';
  return 'İşlem şu anda tamamlanamadı. Bağlantını kontrol edip tekrar deneyebilirsin.';
}
