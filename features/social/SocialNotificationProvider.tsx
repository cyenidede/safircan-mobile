import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { router, type Href } from 'expo-router';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { AppState, Platform } from 'react-native';

import { useAuth } from '@/features/auth/AuthProvider';
import { getUnreadSocialNotificationCount, markSocialNotificationsRead, registerSocialPushToken, type SocialNotificationItem } from './api';
import { loadNotificationsModule, remotePushAvailable } from './notificationRuntime';
import { getSocialPushDeviceId } from './pushDevice';
import { isSafeQuestionId } from '@/features/questions/domain';
import { matchesNotificationRead } from './notificationPresentation';

const PROMPT_DISMISSED_KEY = 'safircan.social.push-prompt-dismissed.v1';
const PENDING_ROUTE_KEY = 'safircan.social.pending-notification-route.v1';

type NotificationType = 'soulmate_match' | 'private_message' | 'question_answered';
type NotificationResponse = { notification: { request: { content: { data?: Record<string, unknown> } } } };
type ContextValue = {
  unreadCount: number;
  notifications: SocialNotificationItem[];
  shouldPrompt: boolean;
  refreshUnread: () => Promise<void>;
  markRead: (type: NotificationType, entityId?: string) => Promise<void>;
  enablePush: () => Promise<boolean>;
  dismissPrompt: () => Promise<void>;
};

const Context = createContext<ContextValue | null>(null);

function projectId() {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return Constants.easConfig?.projectId ?? extra?.eas?.projectId ?? null;
}

export function safeNotificationRoute(data: Record<string, unknown> | undefined) {
  if (!data) return null;
  const routeData = typeof data.route_data === 'object' && data.route_data !== null ? data.route_data as Record<string, unknown> : typeof data.routeData === 'object' && data.routeData !== null ? data.routeData as Record<string, unknown> : data;
  if (data.type === 'soulmate_match' || data.route === '/soulmate') return '/soulmate' as Href;
  if ((data.type === 'private_message' || data.route === '/private-chat') && typeof data.conversationId === 'string') {
    return { pathname: '/private-chat', params: { conversationId: data.conversationId } } as Href;
  }
  if ((data.type === 'question_answered' || data.type === undefined) && isSafeQuestionId(routeData.questionId)) {
    return `/questions/${routeData.questionId}` as Href;
  }
  return null;
}

export function SocialNotificationProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<SocialNotificationItem[]>([]);
  const [shouldPrompt, setShouldPrompt] = useState(false);

  const applyCount = useCallback(async (count: number) => {
    const safeCount = Math.max(0, Math.trunc(count) || 0);
    setUnreadCount(safeCount);
    const notifications = await loadNotificationsModule();
    if (notifications) try { await notifications.setBadgeCountAsync(safeCount); } catch { /* Platform badge is optional. */ }
  }, []);

  const refreshUnread = useCallback(async () => {
    if (!session?.access_token) { await applyCount(0); return; }
    try { const result = await getUnreadSocialNotificationCount(session.access_token); const items = Array.isArray(result.notifications) ? result.notifications : []; if (__DEV__) { console.log(`[notifications] unread status=200 count=${result.unreadCount}`); if (items.filter((item) => !item.read).length !== result.unreadCount) console.log(`[notifications] list-count-mismatch unread=${result.unreadCount} rows=${items.filter((item) => !item.read).length}`); } setNotifications(items); await applyCount(result.unreadCount); }
    catch { /* Keep the last server-backed UI value during temporary network failures. */ }
  }, [applyCount, session?.access_token]);

  const markRead = useCallback(async (type: NotificationType, entityId?: string) => {
    if (!session?.access_token) return;
    try { const result = await markSocialNotificationsRead(session.access_token, { type, entityId }); setNotifications((items) => items.map((item) => matchesNotificationRead(item, type, entityId) ? { ...item, read: true } : item)); await applyCount(result.unreadCount); }
    catch { await refreshUnread(); }
  }, [applyCount, refreshUnread, session?.access_token]);

  const dismissPrompt = useCallback(async () => { await AsyncStorage.setItem(PROMPT_DISMISSED_KEY, '1'); setShouldPrompt(false); }, []);

  const enablePush = useCallback(async () => {
    if (!remotePushAvailable || !session?.access_token || !Device.isDevice || (Platform.OS !== 'ios' && Platform.OS !== 'android')) return false;
    try {
      const notifications = await loadNotificationsModule();
      if (!notifications) return false;
      let permission = await notifications.getPermissionsAsync();
      if (permission.status !== 'granted') permission = await notifications.requestPermissionsAsync();
      if (permission.status !== 'granted') { await dismissPrompt(); return false; }
      const easProjectId = projectId();
      if (!easProjectId) return false;
      const token = await notifications.getExpoPushTokenAsync({ projectId: easProjectId });
      await registerSocialPushToken(session.access_token, { token: token.data, platform: Platform.OS, deviceId: await getSocialPushDeviceId() });
      await dismissPrompt();
      return true;
    } catch { return false; }
  }, [dismissPrompt, session?.access_token]);

  useEffect(() => { void AsyncStorage.getItem(PROMPT_DISMISSED_KEY).then((value) => setShouldPrompt(value !== '1')); }, []);
  useEffect(() => { void refreshUnread(); }, [refreshUnread]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') void refreshUnread(); });
    return () => subscription.remove();
  }, [refreshUnread]);

  useEffect(() => {
    if (!remotePushAvailable) return;
    let active = true;
    let received: { remove: () => void } | undefined;
    let opened: { remove: () => void } | undefined;
    const openResponse = (response: NotificationResponse) => {
      const route = safeNotificationRoute(response.notification.request.content.data);
      if (!route) return;
      if (session?.access_token) router.push(route);
      else void AsyncStorage.setItem(PENDING_ROUTE_KEY, JSON.stringify(route)).then(() => router.push('/sign-in'));
    };
    void loadNotificationsModule().then(async (notifications) => {
      if (!active || !notifications) return;
      notifications.setNotificationHandler({ handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: true, shouldShowBanner: true, shouldShowList: true }) });
      received = notifications.addNotificationReceivedListener(() => { void refreshUnread(); });
      opened = notifications.addNotificationResponseReceivedListener(openResponse);
      const response = await notifications.getLastNotificationResponseAsync();
      if (active && response) await notifications.clearLastNotificationResponseAsync().then(() => openResponse(response));
    }).catch(() => undefined);
    return () => { active = false; received?.remove(); opened?.remove(); };
  }, [refreshUnread, session?.access_token]);

  useEffect(() => {
    if (!session?.access_token) return;
    void AsyncStorage.getItem(PENDING_ROUTE_KEY).then((raw) => {
      if (!raw) return;
      return AsyncStorage.removeItem(PENDING_ROUTE_KEY).then(() => router.push(JSON.parse(raw) as Href));
    }).catch(() => undefined);
  }, [session?.access_token]);

  const value = useMemo<ContextValue>(() => ({ unreadCount, notifications, shouldPrompt, refreshUnread, markRead, enablePush, dismissPrompt }), [dismissPrompt, enablePush, markRead, notifications, refreshUnread, shouldPrompt, unreadCount]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSocialNotifications() {
  const value = useContext(Context);
  if (!value) throw new Error('useSocialNotifications must be used within SocialNotificationProvider');
  return value;
}

export function formatUnreadBadge(count: number) { return count > 99 ? '99+' : String(Math.max(0, count)); }
