import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const chat = readFileSync(new URL('./PrivateChatExperience.tsx', import.meta.url), 'utf8');
const composer = readFileSync(new URL('./ChatComposer.tsx', import.meta.url), 'utf8');

test('sender sees a local sending bubble before the request finishes', () => {
  assert.match(chat, /local_\$\{Date\.now\(\)\}/);
  assert.match(chat, /deliveryStatus: 'sending'/);
  assert.match(chat, /setMessages\(\(items\) => \[\.\.\.items/);
  assert.match(chat, /scheduleDelivery\(localId, body, startedAt\)/);
  assert.match(chat, /requestAnimationFrame\(\(\) =>/);
  assert.match(chat, /logTiming\('first-frame'/);
});

test('server response reconciles the temporary message without a full conversation refetch', () => {
  assert.match(chat, /id: result\.messageId/);
  assert.match(chat, /normalizeMessageTimestamp\(result\.createdAt, item\.createdAt\)/);
  assert.match(chat, /conversation-refetch skipped/);
  assert.doesNotMatch(chat, /await load\(\)/);
});

test('retryable failures remain visible and rejected messages roll back', () => {
  assert.match(chat, /deliveryStatus: 'failed'/);
  assert.match(chat, /m\.sendFailed/);
  assert.match(chat, /items\.filter\(\(item\) => item\.id !== localId\)/);
  assert.match(chat, /quota_exceeded/);
});

test('double submit is guarded and the composer does not show a blocking spinner', () => {
  assert.match(composer, /pressLocked\.current/);
  assert.doesNotMatch(composer, /ActivityIndicator/);
});

test('immediate composer clears input synchronously without awaiting the network callback', () => {
  assert.match(composer, /const result = onSend\(trimmed\)/);
  assert.match(composer, /if \(immediate\) \{ bodyRef\.current = ''; setBody\(''\); \}/);
  assert.doesNotMatch(composer, /await onSend/);
  assert.match(chat, /sending=\{false\} immediate onSend=\{send\}/);
});

test('network starts only from the first-frame callback', () => {
  const schedule = chat.match(/const scheduleDelivery[\s\S]+?\}, \[deliver, logTiming\]\);/)?.[0] ?? '';
  assert.match(schedule, /requestAnimationFrame/);
  assert.match(schedule, /void deliver/);
  const send = chat.match(/const send = \(body: string\)[\s\S]+?return true;\n  \};/)?.[0] ?? '';
  assert.doesNotMatch(send, /deliver\(/);
});

test('optimistic row is in FlatList data and scrolls into view after real layout', () => {
  assert.match(chat, /data=\{messages\}/);
  assert.match(chat, /keyExtractor=\{\(item\) => item\.id\}/);
  assert.match(chat, /flatlist-data local-present=/);
  assert.match(chat, /optimistic-row-render id=/);
  assert.match(chat, /optimistic-row-layout id=/);
  assert.match(chat, /onLayout=\{\(\) =>/);
  assert.match(chat, /scrollToEnd\(\{ animated: false \}\)/);
  assert.match(chat, /messageList: \{ flex: 1 \}/);
  assert.doesNotMatch(chat, /inverted/);
});
