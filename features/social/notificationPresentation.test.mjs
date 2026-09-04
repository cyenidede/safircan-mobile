import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

import ts from 'typescript';

const source = readFileSync(new URL('./notificationPresentation.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, { exports: module.exports, module, Map, Date, Number });
const { formatNotificationCount, groupSocialNotifications, matchesNotificationRead } = module.exports;

const message = (notificationId, conversationId, createdAt, read = false, handle = 'muetiman') => ({
  notificationId, type: 'private_message', conversationId, handle, createdAt, read,
});

test('same-conversation messages become one row with an unread count', () => {
  const rows = groupSocialNotifications([
    message('n1', 'c1', '2026-09-02T09:00:00.000Z'),
    message('n2', 'c1', '2026-09-02T10:00:00.000Z'),
    message('n3', 'c1', '2026-09-02T11:00:00.000Z'),
  ]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].unreadCount, 3);
  assert.equal(rows[0].latestCreatedAt, '2026-09-02T11:00:00.000Z');
});

test('conversations stay separate and sort by latest message', () => {
  const rows = groupSocialNotifications([
    message('a1', 'c1', '2026-09-02T10:00:00.000Z'),
    message('b1', 'c2', '2026-09-02T12:00:00.000Z', false, 'ayse34'),
    message('a2', 'c1', '2026-09-02T11:00:00.000Z'),
  ]);
  assert.deepEqual(Array.from(rows, (row) => row.conversationId), ['c2', 'c1']);
  assert.deepEqual(Array.from(rows, (row) => row.unreadCount), [1, 2]);
});

test('soulmate remains separate and read message history does not duplicate a conversation', () => {
  const soulmate = { notificationId: 's1', type: 'soulmate_match', handle: 'ayse34', createdAt: '2026-09-02T12:00:00.000Z', read: false };
  const rows = groupSocialNotifications([
    message('n1', 'c1', '2026-09-01T10:00:00.000Z', true),
    message('n2', 'c1', '2026-09-02T11:00:00.000Z'),
    soulmate,
  ]);
  assert.equal(rows.length, 2);
  assert.equal(rows.find((row) => row.type === 'private_message').unreadCount, 1);
  assert.equal(rows.find((row) => row.type === 'soulmate_match').unreadCount, 1);
});

test('row counter caps at 99+', () => {
  assert.deepEqual([1, 3, 99, 100].map(formatNotificationCount), ['1', '3', '99', '99+']);
});

test('question read matching is scoped to the exact question id', () => {
  const first = { notificationId: 'q1', type: 'question_answered', questionId: 'question-1', handle: null, createdAt: '2026-09-04T10:00:00.000Z', read: false };
  assert.equal(matchesNotificationRead(first, 'question_answered', 'question-1'), true);
  assert.equal(matchesNotificationRead(first, 'question_answered', 'question-2'), false);
  assert.equal(matchesNotificationRead(first, 'private_message', 'question-1'), false);
  assert.equal(matchesNotificationRead(first, 'soulmate_match'), false);
});

test('private message and soulmate matching semantics remain unchanged', () => {
  assert.equal(matchesNotificationRead(message('n1', 'conversation-1', '2026-09-04T10:00:00.000Z'), 'private_message', 'conversation-1'), true);
  assert.equal(matchesNotificationRead(message('n1', 'conversation-1', '2026-09-04T10:00:00.000Z'), 'private_message', 'conversation-2'), false);
  const soulmate = { notificationId: 's1', type: 'soulmate_match', handle: null, createdAt: '2026-09-04T10:00:00.000Z', read: false };
  assert.equal(matchesNotificationRead(soulmate, 'soulmate_match'), true);
});
