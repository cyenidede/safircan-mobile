import type { SocialNotificationItem } from './api';

export type SocialNotificationRow = SocialNotificationItem & {
  latestCreatedAt: string;
  unreadCount: number;
};

function timestamp(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function groupSocialNotifications(notifications: SocialNotificationItem[]): SocialNotificationRow[] {
  const messageRows = new Map<string, SocialNotificationRow>();
  const rows: SocialNotificationRow[] = [];

  for (const item of notifications) {
    if (item.type !== 'private_message' || !item.conversationId) {
      rows.push({ ...item, latestCreatedAt: item.createdAt, unreadCount: item.read ? 0 : 1 });
      continue;
    }

    const existing = messageRows.get(item.conversationId);
    if (!existing) {
      messageRows.set(item.conversationId, {
        ...item,
        latestCreatedAt: item.createdAt,
        unreadCount: item.read ? 0 : 1,
      });
      continue;
    }

    existing.unreadCount += item.read ? 0 : 1;
    existing.read = existing.unreadCount === 0;
    if (timestamp(item.createdAt) > timestamp(existing.latestCreatedAt)) {
      existing.notificationId = item.notificationId;
      existing.createdAt = item.createdAt;
      existing.latestCreatedAt = item.createdAt;
      existing.handle = item.handle;
    }
  }

  rows.push(...messageRows.values());
  return rows.sort((left, right) => timestamp(right.latestCreatedAt) - timestamp(left.latestCreatedAt));
}

export function formatNotificationCount(count: number) {
  return count > 99 ? '99+' : String(Math.max(0, count));
}

export function matchesNotificationRead(item: SocialNotificationItem, type: 'soulmate_match' | 'private_message' | 'question_answered', entityId?: string) {
  if (item.type !== type) return false;
  if (!entityId) return true;
  return type === 'question_answered' ? item.questionId === entityId : item.conversationId === entityId;
}
