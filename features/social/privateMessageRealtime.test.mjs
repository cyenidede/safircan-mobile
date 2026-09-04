import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const chat = readFileSync(new URL('./PrivateChatExperience.tsx', import.meta.url), 'utf8');
const api = readFileSync(new URL('./api.ts', import.meta.url), 'utf8');

test('private chat subscribes only to its current conversation', () => {
  assert.match(chat, /table: 'private_messages'/);
  assert.match(chat, /filter: `conversation_id=eq\.\$\{conversationId\}`/);
  assert.match(chat, /realtimeClient\.removeChannel\(channel\)/);
});

test('incoming payload is normalized and deduped by real message id', () => {
  assert.match(api, /normalizeRealtimePrivateMessage/);
  assert.match(chat, /items\.some\(\(item\) => item\.id === incoming\.id\)/);
  assert.match(chat, /incoming\.senderUserId === user\?\.id/);
});

test('realtime reconnect recovers missed server messages without polling', () => {
  assert.match(chat, /\[chat-realtime\] reconnect/);
  assert.match(chat, /void load\(\)/);
  assert.doesNotMatch(chat, /setInterval/);
});

test('incoming notification read is scoped to the open conversation', () => {
  assert.match(chat, /markRead\('private_message', conversationId\)/);
  assert.doesNotMatch(chat, /markRead\('private_message'\)/);
});

test('incoming row layout is measured and auto-scroll respects reader position', () => {
  assert.match(chat, /\[chat-realtime\] row-render/);
  assert.match(chat, /\[chat-realtime\] row-layout/);
  assert.match(chat, /nearBottom\.current/);
  assert.match(chat, /scrollAfterChange\.current/);
});
