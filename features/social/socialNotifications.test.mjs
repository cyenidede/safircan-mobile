import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const provider = readFileSync(new URL('./SocialNotificationProvider.tsx', import.meta.url), 'utf8');
const profile = readFileSync(new URL('../../app/(tabs)/profile.tsx', import.meta.url), 'utf8');
const soulmate = readFileSync(new URL('./SoulmateExperience.tsx', import.meta.url), 'utf8');
const chat = readFileSync(new URL('./PrivateChatExperience.tsx', import.meta.url), 'utf8');
const community = readFileSync(new URL('./CommunityExperience.tsx', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('./notificationRuntime.ts', import.meta.url), 'utf8');
const panel = readFileSync(new URL('./SocialNotificationsPanel.tsx', import.meta.url), 'utf8');

test('badge is hidden at zero and capped at 99+', () => {
  assert.match(profile, /unreadCount > 0/);
  const expression = provider.match(/export function formatUnreadBadge\(count: number\) \{ return (.+); \}/)?.[1];
  assert.ok(expression);
  const format = new Function('count', `return ${expression}`);
  assert.deepEqual([0, 1, 3, 99, 100].map(format), ['0', '1', '3', '99', '99+']);
});

test('approved notification types deep-link only to their own screens', () => {
  assert.match(provider, /soulmate_match[^\n]+\/soulmate/);
  assert.match(provider, /private_message[^\n]+\/private-chat/);
});

test('question answered push accepts only a safe question id and routes to detail', () => {
  assert.match(provider, /data\.type === 'question_answered' \|\| data\.type === undefined/);
  assert.match(provider, /isSafeQuestionId\(routeData\.questionId\)/);
  assert.match(provider, /`\/questions\/\$\{routeData\.questionId\}`/);
  assert.doesNotMatch(provider, /questionText|answerText|birthData|pushToken/);
});

test('question push reuses foreground refresh and common tap and cold-start listeners', () => {
  assert.match(provider, /addNotificationReceivedListener\(\(\) => \{ void refreshUnread\(\); \}\)/);
  assert.match(provider, /addNotificationResponseReceivedListener\(openResponse\)/);
  assert.match(provider, /getLastNotificationResponseAsync\(\)/);
  assert.match(provider, /safeNotificationRoute\(response\.notification\.request\.content\.data\)/);
});

test('opening soulmate and private chat marks server notifications read', () => {
  assert.match(soulmate, /markRead\('soulmate_match'\)/);
  assert.match(chat, /markRead\('private_message', params\.conversationId\)/);
});

test('server count refreshes on foreground without prompting from social center', () => {
  assert.match(provider, /AppState\.addEventListener\('change'/);
  assert.match(provider, /state === 'active'\) void refreshUnread\(\)/);
  assert.doesNotMatch(community, /BİLDİRİMLERİ AÇ|requestPermissionsAsync/);
});

test('Expo Go skips the lazily loaded remote notification module', () => {
  assert.doesNotMatch(provider, /^import .*['"]expo-notifications['"];?$/m);
  assert.match(runtime, /ExecutionEnvironment\.StoreClient/);
  assert.match(runtime, /if \(!remotePushAvailable\) return null/);
  assert.match(runtime, /await import\('expo-notifications'\)/);
  assert.match(provider, /if \(!remotePushAvailable\) return/);
  assert.match(provider, /getUnreadSocialNotificationCount/);
});

test('community renders safe server notification rows without marking them read', () => {
  assert.match(community, /SocialNotificationsPanel/);
  assert.match(community, /refreshUnread/);
  assert.doesNotMatch(community, /markRead\(/);
  assert.match(panel, /Yeni mesaj/);
  assert.match(panel, /Yeni güçlü eşleşme/);
  assert.match(panel, /Henüz yeni bildirimin yok/);
  assert.doesNotMatch(panel, /message\.body|senderUserId|actor_user_id|recipient_user_id/);
});

test('notification rows route to the related screen and never mark read on press', () => {
  assert.match(panel, /pathname: '\/private-chat'/);
  assert.match(panel, /router\.push\('\/soulmate'/);
  assert.doesNotMatch(panel, /markSocialNotificationsRead|markRead/);
});

test('question detail marks only its matching answered notification without blocking rendering', () => {
  const detail = readFileSync(new URL('../../app/questions/[id].tsx', import.meta.url), 'utf8');
  assert.match(detail, /notification\.type==='question_answered'&&notification\.questionId===id&&!notification\.read/);
  assert.match(detail, /void markRead\('question_answered',id\)/);
  assert.doesNotMatch(detail, /await markRead\('question_answered'/);
  assert.match(provider, /matchesNotificationRead\(item, type, entityId\)/);
  assert.match(provider, /applyCount\(result\.unreadCount\)/);
});
