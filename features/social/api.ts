import { normalizeMessageTimestamp } from './messageTime';

const API_BASE_URL = 'https://safircan.com';

export type SocialUsage = { allowed: boolean; subscribed: boolean; freeMessagesUsed: number; freeMessagesRemaining: number };
export type RelationshipStatus = 'single' | 'married' | 'prefer_not_to_say';
export type RelationshipIntent = 'meet' | 'serious' | 'friendship';
export type PublicSocialProfile = { userId: string; handle: string | null; photoUrl: string | null; bio: string | null; sunSign?: string; age: number | null; city?: string; relationshipStatus: RelationshipStatus; relationshipIntent: RelationshipIntent; showZodiacSign?: boolean };
export type SoulmateMatch = { score: number; categories: Array<{ id: string; label: string; score: number; level: string }> };
export type SoulmateCandidate = { profile: PublicSocialProfile; match: SoulmateMatch };
export type SoulmateResponse = { success: true; status: 'success' | 'profile_required'; candidates: SoulmateCandidate[]; newCount: number; total: number; page: number; hasMore: boolean };
export type SocialMessage = { id: string; senderUserId: string; senderHandle: string | null; body: string; createdAt: string; deliveryStatus?: 'sending' | 'failed' };
export type GroupMessage = { id: string; body: string; createdAt: string; sender: PublicSocialProfile };
export type SocialNotificationItem = { notificationId: string; type: 'soulmate_match' | 'private_message' | 'question_answered' | string; conversationId?: string; questionId?: string; handle: string | null; createdAt: string; read: boolean };

export class SocialApiError extends Error {
  constructor(public readonly status: number, public readonly code?: string, message?: string, public readonly usage?: SocialUsage) { super(message || code || 'social_error'); }
}

export function normalizeRealtimePrivateMessage(value: unknown, peerHandle: string | null): SocialMessage | null {
  if (!isRecord(value)) return null;
  const id = typeof value.id === 'string' ? value.id : '';
  const senderUserId = typeof value.sender_user_id === 'string' ? value.sender_user_id : '';
  const body = typeof value.body === 'string' ? value.body : '';
  const createdAt = normalizeMessageTimestamp(value.created_at);
  if (!id || !senderUserId || !body || !createdAt) return null;
  return { id, senderUserId, senderHandle: peerHandle, body, createdAt };
}

export function socialErrorMessage(error: unknown, fallback = 'İşlem şu anda tamamlanamadı. Biraz sonra tekrar deneyebilirsin.') {
  if (!(error instanceof SocialApiError)) return fallback;
  if (error.status === 401 || error.code === 'unauthorized') return 'Devam etmek için hesabına giriş yapman gerekiyor.';
  if (error.code === 'profile_incomplete' || error.code === 'profile_required' || error.code === 'handle_required') return 'Devam etmek için önce sosyal tercihlerini seçmen gerekiyor.';
  if (error.code === 'quota_exceeded') return 'Ücretsiz mesaj hakkın doldu.';
  if (error.code === 'contact_not_allowed') return 'Güvenliğin için mesajlarda telefon, e-posta veya bağlantı paylaşamazsın.';
  if (error.code === 'age_restricted' || error.code === 'underage') return 'Bu alan henüz senin için açık değil.';
  if (error.code === 'group_not_allowed') return 'Yalnızca kendi burç grubuna katılabilirsin.';
  if (error.status === 403 || error.code === 'forbidden') return 'Bu işlem için gerekli erişimin bulunmuyor.';
  return fallback;
}

async function socialRequest<T>(token: string, path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers } });
  const data = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok || data.success === false) throw new SocialApiError(response.status, typeof data.error === 'string' ? data.error : undefined, typeof data.message === 'string' ? data.message : undefined, data.usage as SocialUsage | undefined);
  return data as T;
}

export async function getSocialHome(token: string) {
  try {
    const result = await socialRequest<{ success: true; profile: PublicSocialProfile; preferencesRequired: boolean; usage: SocialUsage }>(token, '/api/social/profile');
    if (__DEV__) console.log('[social-profile] status=200');
    return result;
  } catch (cause) {
    if (__DEV__ && cause instanceof SocialApiError) {
      console.log(`[social-profile] status=${cause.status}`);
      console.log(`[social-profile] code=${cause.code ?? 'unknown'}`);
    }
    throw cause;
  }
}
export const saveSocialProfile = (token: string, input: { handle: string; bio: string; relationshipStatus: RelationshipStatus; relationshipIntent: RelationshipIntent; showZodiacSign: boolean; isActive: boolean }) => socialRequest<{ success: true; profile: PublicSocialProfile; preferencesRequired: false }>(token, '/api/social/profile', { method: 'PUT', body: JSON.stringify(input) });
export const saveSocialPhoto = (token: string, path: string) => socialRequest<{ success: true }>(token, '/api/social/photo', { method: 'POST', body: JSON.stringify({ path }) });
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function normalizeSoulmateResponse(value: unknown, requestedPage = 1): SoulmateResponse {
  const source = isRecord(value) ? value : {};
  const candidates = Array.isArray(source.candidates)
    ? source.candidates.flatMap((candidate): SoulmateCandidate[] => {
      if (!isRecord(candidate) || !isRecord(candidate.profile) || !isRecord(candidate.match)) return [];
      const profile = candidate.profile as PublicSocialProfile;
      if (typeof profile.userId !== 'string' || !profile.userId) return [];
      const categories = Array.isArray(candidate.match.categories)
        ? candidate.match.categories.filter((category): category is SoulmateMatch['categories'][number] => (
          isRecord(category)
          && typeof category.id === 'string'
          && typeof category.label === 'string'
          && typeof category.score === 'number'
          && typeof category.level === 'string'
        ))
        : [];
      const score = typeof candidate.match.score === 'number' && Number.isFinite(candidate.match.score)
        ? candidate.match.score
        : Number.NaN;
      return [{ profile, match: { score, categories } }];
    })
    : [];

  return {
    success: true,
    status: source.status === 'profile_required' ? 'profile_required' : 'success',
    candidates,
    newCount: typeof source.newCount === 'number' ? source.newCount : 0,
    total: typeof source.total === 'number' ? source.total : candidates.length,
    page: typeof source.page === 'number' ? source.page : requestedPage,
    hasMore: source.hasMore === true,
  };
}

export const getSoulmates = async (token: string, page = 1, summary = false) => {
  const response = await socialRequest<unknown>(token, `/api/social/soulmate?page=${page}&limit=5${summary ? '&summary=true' : ''}`);
  return normalizeSoulmateResponse(response, page);
};
export const getPublicSocialProfile = (token: string, userId: string) => socialRequest<{ success: true; profile: PublicSocialProfile; match: SoulmateMatch }>(token, `/api/social/public-profile?userId=${encodeURIComponent(userId)}`);
export const startConversation = (token: string, targetUserId: string) => socialRequest<{ success: true; conversationId: string }>(token, '/api/social/soulmate', { method: 'POST', body: JSON.stringify({ targetUserId }) });
export const getConversation = async (token: string, conversationId: string) => {
  const result = await socialRequest<{ success: true; peerHandle: string | null; messages: SocialMessage[]; usage: SocialUsage }>(token, `/api/social/messages?conversationId=${encodeURIComponent(conversationId)}`);
  return { ...result, messages: (Array.isArray(result.messages) ? result.messages : []).map((message) => ({ ...message, createdAt: normalizeMessageTimestamp(message.createdAt) ?? '' })) };
};
export const sendPrivateMessage = (token: string, conversationId: string, body: string) => socialRequest<{ success: true; messageId: string; createdAt?: string; usage: SocialUsage }>(token, '/api/social/messages', { method: 'POST', body: JSON.stringify({ conversationId, body }) });
export const getZodiacGroup = (token: string) => socialRequest<{ success: true; group: { sign: string; displayName: string }; messages: GroupMessage[]; usage: SocialUsage }>(token, '/api/social/group');
export const sendZodiacGroupMessage = (token: string, body: string) => socialRequest<{ success: true; messageId: string; usage: SocialUsage }>(token, '/api/social/group', { method: 'POST', body: JSON.stringify({ body }) });
export const moderateUser = (token: string, input: { action: 'block' | 'unblock' | 'report'; targetUserId?: string; reportedUserId?: string; reportType?: 'user' | 'message' | 'photo'; photoReference?: string; messageId?: string; reason?: string; details?: string }) => socialRequest<{ success: true }>(token, '/api/social/moderation', { method: 'POST', body: JSON.stringify(input) });
export const getUnreadSocialNotificationCount = async (token: string) => {
  const result = await socialRequest<{ success: true; unreadCount: number; notifications?: Array<SocialNotificationItem & { routeData?: unknown; route_data?: unknown }> }>(token, '/api/social/notifications');
  const notifications = (result.notifications ?? []).map((item) => {
    const routeData = isRecord(item.routeData) ? item.routeData : isRecord(item.route_data) ? item.route_data : null;
    const questionId = typeof item.questionId === 'string' ? item.questionId : routeData && typeof routeData.questionId === 'string' ? routeData.questionId : undefined;
    return { ...item, ...(questionId ? { questionId } : {}) };
  });
  return { ...result, notifications };
};
export const markSocialNotificationsRead = (token: string, input: { type: 'soulmate_match' | 'private_message' | 'question_answered'; entityId?: string }) => socialRequest<{ success: true; unreadCount: number }>(token, '/api/social/notifications', { method: 'PATCH', body: JSON.stringify(input) });
export const registerSocialPushToken = (token: string, input: { token: string; platform: 'ios' | 'android'; deviceId: string }) => socialRequest<{ success: true }>(token, '/api/social/push-token', { method: 'PUT', body: JSON.stringify(input) });
export const disableSocialPushToken = (token: string, deviceId: string) => socialRequest<{ success: true }>(token, '/api/social/push-token', { method: 'DELETE', body: JSON.stringify({ deviceId }) });
