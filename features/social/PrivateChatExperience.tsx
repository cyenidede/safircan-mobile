import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, type NativeScrollEvent, type NativeSyntheticEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { getAuthenticatedBirthProfile } from '@/features/astrology/api/birth-profile';
import { useAuth } from '@/features/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import { ChatComposer } from './ChatComposer';
import { getConversation, moderateUser, normalizeRealtimePrivateMessage, sendPrivateMessage, socialErrorMessage, SocialApiError, type SocialMessage, type SocialUsage } from './api';
import { SocialAccessState } from './SocialAccessState';
import { useSocialNotifications } from './SocialNotificationProvider';
import { formatMessageTime, normalizeMessageTimestamp } from './messageTime';

type SendTiming = { startedAt: number; rendered: boolean; laidOut: boolean };

function mergeConversationMessages(serverMessages: SocialMessage[], currentMessages: SocialMessage[]) {
  const byId = new Map(serverMessages.map((message) => [message.id, message]));
  for (const message of currentMessages) if (message.id.startsWith('local_') && !byId.has(message.id)) byId.set(message.id, message);
  return [...byId.values()].sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt));
}

export function PrivateChatExperience() {
  const params = useLocalSearchParams<{ conversationId?: string; handle?: string; targetUserId?: string }>();
  const { session, user } = useAuth();
  const { markRead } = useSocialNotifications();
  const listRef = useRef<FlatList<SocialMessage>>(null);
  const pendingIds = useRef(new Set<string>());
  const renderedLocalIds = useRef(new Set<string>());
  const timings = useRef(new Map<string, SendTiming>());
  const realtimeTimings = useRef(new Map<string, number>());
  const renderedRealtimeIds = useRef(new Set<string>());
  const laidOutRealtimeIds = useRef(new Set<string>());
  const nearBottom = useRef(true);
  const scrollAfterChange = useRef(true);
  const [messages, setMessages] = useState<SocialMessage[]>([]);
  const [usage, setUsage] = useState<SocialUsage | null>(null);
  const [peerHandle, setPeerHandle] = useState(params.handle ?? '');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [underage, setUnderage] = useState(false);
  const [birthRequired, setBirthRequired] = useState(false);

  const logTiming = useCallback((stage: string, startedAt: number) => {
    if (__DEV__) console.log(`[message-send] ${stage} ${Math.round(performance.now() - startedAt)}ms`);
  }, []);

  const load = useCallback(async () => {
    if (!session?.access_token || !params.conversationId) { setLoading(false); return; }
    try {
      const birthProfile = await getAuthenticatedBirthProfile(session.access_token);
      if (!birthProfile?.birth_date) { setBirthRequired(true); return; }
      const result = await getConversation(session.access_token, params.conversationId);
      setUnderage(false); setBirthRequired(false); setMessages((current) => mergeConversationMessages(result.messages, current)); setUsage(result.usage); setPeerHandle(result.peerHandle ?? '');
      scrollAfterChange.current = true;
      void markRead('private_message', params.conversationId);
    } catch (error) {
      if (error instanceof SocialApiError && error.code === 'age_restricted') setUnderage(true);
      else setFeedback('Konuşma şu anda yüklenemedi.');
    } finally { setLoading(false); }
  }, [markRead, params.conversationId, session?.access_token]);
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const conversationId = params.conversationId;
    const realtimeClient = supabase;
    if (!realtimeClient || !session?.access_token || !conversationId) return;
    let active = true;
    let subscribed = false;
    const readTimers = new Set<ReturnType<typeof setTimeout>>();
    const channel = realtimeClient.channel(`private-chat:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'private_messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        if (!active) return;
        const receivedAt = performance.now();
        const incoming = normalizeRealtimePrivateMessage(payload.new, peerHandle || null);
        if (!incoming) return;
        let deduped = incoming.senderUserId === user?.id;
        if (!deduped) {
          realtimeTimings.current.set(incoming.id, receivedAt);
          setMessages((items) => {
            if (items.some((item) => item.id === incoming.id)) { deduped = true; return items; }
            return [...items, incoming];
          });
          if (nearBottom.current) scrollAfterChange.current = true;
        }
        if (__DEV__) console.log(`[chat-realtime] incoming messageId=${incoming.id} deduped=${deduped}`);
        if (!deduped) {
          if (__DEV__) console.log(`[chat-realtime] message-state ${Math.round(performance.now() - receivedAt)}ms`);
          const timer = setTimeout(() => { readTimers.delete(timer); if (active) void markRead('private_message', conversationId); }, 350);
          readTimers.add(timer);
        }
      })
      .subscribe((status) => {
        if (!active || status !== 'SUBSCRIBED') return;
        if (subscribed) { if (__DEV__) console.log('[chat-realtime] reconnect'); void load(); }
        else { subscribed = true; if (__DEV__) console.log('[chat-realtime] subscribed'); }
      });
    return () => {
      active = false;
      for (const timer of readTimers) clearTimeout(timer);
      void realtimeClient.removeChannel(channel);
      if (__DEV__) console.log('[chat-realtime] unsubscribed');
    };
  }, [load, markRead, params.conversationId, peerHandle, session?.access_token, user?.id]);

  useEffect(() => {
    if (__DEV__) console.log(`[message-send] flatlist-data local-present=${messages.some((message) => message.id.startsWith('local_'))} count=${messages.length}`);
    for (const message of messages) {
      const timing = timings.current.get(message.id);
      if (timing && !timing.rendered) { timing.rendered = true; logTiming('client-render', timing.startedAt); }
    }
  }, [logTiming, messages]);

  const deliver = useCallback(async (localId: string, body: string, startedAt: number) => {
    if (!session?.access_token || !params.conversationId) return;
    logTiming('network-start', startedAt);
    try {
      const result = await sendPrivateMessage(session.access_token, params.conversationId, body);
      logTiming('response', startedAt);
      setUsage(result.usage);
      setMessages((items) => items.map((item) => item.id === localId ? { ...item, id: result.messageId, createdAt: normalizeMessageTimestamp(result.createdAt, item.createdAt) ?? item.createdAt, deliveryStatus: undefined } : item));
      logTiming('reconcile', startedAt);
      timings.current.delete(localId);
      if (__DEV__) console.log('[message-send] conversation-refetch skipped');
    } catch (error) {
      if (error instanceof SocialApiError && error.usage) setUsage(error.usage);
      const retryable = !(error instanceof SocialApiError) || error.status >= 500;
      if (retryable) {
        setMessages((items) => items.map((item) => item.id === localId ? { ...item, deliveryStatus: 'failed' } : item));
      } else {
        setMessages((items) => items.filter((item) => item.id !== localId));
        timings.current.delete(localId);
      }
      if (!(error instanceof SocialApiError && error.code === 'quota_exceeded')) setFeedback(socialErrorMessage(error, 'Mesaj gönderilemedi. Tekrar deneyebilirsin.'));
    } finally {
      pendingIds.current.delete(localId);
    }
  }, [logTiming, params.conversationId, session?.access_token]);

  const scheduleDelivery = useCallback((localId: string, body: string, startedAt: number) => {
    requestAnimationFrame(() => {
      logTiming('first-frame', startedAt);
      void deliver(localId, body, startedAt);
    });
  }, [deliver, logTiming]);

  const send = (body: string) => {
    const startedAt = performance.now();
    logTiming('press', startedAt);
    setFeedback('');
    const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    pendingIds.current.add(localId);
    scrollAfterChange.current = true;
    timings.current.set(localId, { startedAt, rendered: false, laidOut: false });
    setMessages((items) => [...items, { id: localId, senderUserId: user?.id ?? 'local_sender', senderHandle: null, body, createdAt: new Date().toISOString(), deliveryStatus: 'sending' }]);
    logTiming('optimistic-state', startedAt);
    scheduleDelivery(localId, body, startedAt);
    return true;
  };

  const retry = (message: SocialMessage) => {
    if (message.deliveryStatus !== 'failed' || pendingIds.current.has(message.id)) return;
    const startedAt = performance.now();
    pendingIds.current.add(message.id); setFeedback('');
    timings.current.set(message.id, { startedAt, rendered: true, laidOut: false });
    setMessages((items) => items.map((item) => item.id === message.id ? { ...item, deliveryStatus: 'sending' } : item));
    scheduleDelivery(message.id, message.body, startedAt);
  };

  const moderate = async (action: 'block' | 'report') => { if (!session?.access_token || !params.targetUserId) return; await moderateUser(session.access_token, action === 'block' ? { action, targetUserId: params.targetUserId } : { action, reportedUserId: params.targetUserId, reason: 'Sohbet incelemesi' }).then(() => setFeedback(action === 'block' ? 'Kullanıcı engellendi.' : 'Şikayetin alındı.')).catch(() => setFeedback('İşlem şu anda tamamlanamadı.')); };

  return <SafeAreaView edges={['bottom']} style={styles.safe}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={92} style={styles.safe}>
    <View style={styles.header}><View style={styles.headerCopy}><Text style={styles.title}>{peerHandle ? `@${peerHandle}` : 'Özel Sohbet'}</Text><Text style={styles.subtitle}>Telefon ve e-posta paylaşmadan güvenle sohbet et.</Text></View><Pressable onPress={() => void moderate('block')}><Text style={styles.action}>Engelle</Text></Pressable><Pressable onPress={() => void moderate('report')}><Text style={styles.action}>Şikayet</Text></Pressable></View>
    {loading ? <ActivityIndicator color={colors.sapphire} size="large" style={styles.loading} /> : underage ? <SocialAccessState kind="underage" onPress={() => router.back()} /> : birthRequired ? <SocialAccessState kind="birth_required" onPress={() => router.push('/birth-chart')} /> : <FlatList ref={listRef} style={styles.messageList} contentContainerStyle={styles.list} data={messages} keyExtractor={(item) => item.id} onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => { const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent; nearBottom.current = contentSize.height - layoutMeasurement.height - contentOffset.y < 80; }} scrollEventThrottle={100} onContentSizeChange={() => { if (scrollAfterChange.current) { scrollAfterChange.current = false; listRef.current?.scrollToEnd({ animated: false }); } }} renderItem={({ item }) => { const mine = item.senderUserId === user?.id || item.id.startsWith('local_'); const time = formatMessageTime(item.createdAt); const isLocal = item.id.startsWith('local_'); const realtimeStartedAt = realtimeTimings.current.get(item.id); if (__DEV__ && realtimeStartedAt !== undefined && !renderedRealtimeIds.current.has(item.id)) { renderedRealtimeIds.current.add(item.id); console.log(`[chat-realtime] row-render messageId=${item.id} ${Math.round(performance.now() - realtimeStartedAt)}ms`); } if (__DEV__ && isLocal && !renderedLocalIds.current.has(item.id)) { renderedLocalIds.current.add(item.id); const timing = timings.current.get(item.id); console.log(`[message-send] optimistic-row-render id=${item.id} ${timing ? Math.round(performance.now() - timing.startedAt) : 0}ms`); } return <View onLayout={() => { if (realtimeStartedAt !== undefined && !laidOutRealtimeIds.current.has(item.id)) { laidOutRealtimeIds.current.add(item.id); if (__DEV__) console.log(`[chat-realtime] row-layout messageId=${item.id} ${Math.round(performance.now() - realtimeStartedAt)}ms`); realtimeTimings.current.delete(item.id); } if (!isLocal) return; const timing = timings.current.get(item.id); if (timing && !timing.laidOut) { timing.laidOut = true; if (__DEV__) console.log(`[message-send] optimistic-row-layout id=${item.id} ${Math.round(performance.now() - timing.startedAt)}ms`); } listRef.current?.scrollToEnd({ animated: false }); }} style={[styles.bubble, mine ? styles.mine : styles.theirs]}><Text style={[styles.sender, mine && styles.mineText]}>{mine ? 'Sen' : item.senderHandle ? `@${item.senderHandle}` : 'SafirCan kullanıcısı'}</Text><Text style={[styles.body, mine && styles.mineText]}>{item.body}</Text>{item.deliveryStatus === 'failed' ? <Pressable onPress={() => retry(item)}><Text style={styles.failed}>Gönderilemedi · Tekrar dene</Text></Pressable> : item.deliveryStatus === 'sending' ? <Text style={[styles.time, mine && styles.mineTime]}>Gönderiliyor…</Text> : time ? <Text style={[styles.time, mine && styles.mineTime]}>{time}</Text> : null}</View>; }} />}
    {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}{!loading && !underage && !birthRequired ? <ChatComposer usage={usage} sending={false} immediate onSend={send} /> : null}
  </KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { backgroundColor: colors.background, flex: 1 }, header: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row', gap: 10, padding: 14 }, headerCopy: { flex: 1 }, title: { color: colors.navy, fontSize: 20, fontWeight: '900' }, subtitle: { color: colors.muted, fontSize: 12, lineHeight: 17 }, action: { color: colors.sapphire, fontSize: 12, fontWeight: '800' }, loading: { flex: 1 }, messageList: { flex: 1 }, list: { flexGrow: 1, gap: 9, justifyContent: 'flex-end', padding: 14 }, bubble: { borderRadius: 17, maxWidth: '84%', paddingHorizontal: 13, paddingVertical: 9 }, mine: { alignSelf: 'flex-end', backgroundColor: colors.sapphire }, theirs: { alignSelf: 'flex-start', backgroundColor: colors.surface }, sender: { color: colors.sapphire, fontSize: 12, fontWeight: '900', marginBottom: 3 }, body: { color: colors.navy, fontSize: 15, lineHeight: 21 }, mineText: { color: colors.white }, time: { color: colors.muted, fontSize: 10, marginTop: 4, textAlign: 'right' }, mineTime: { color: '#DCEAF8' }, failed: { color: '#FFE0E0', fontSize: 11, fontWeight: '800', marginTop: 5, textAlign: 'right' }, feedback: { color: colors.danger, fontSize: 13, lineHeight: 18, paddingHorizontal: 14, textAlign: 'center' } });
