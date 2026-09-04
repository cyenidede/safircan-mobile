import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const source = readFileSync(new URL('./messageTime.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { formatMessageTime, normalizeMessageTimestamp } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('optimistic ISO timestamp normalizes and formats safely', () => {
  const value = new Date().toISOString();
  assert.equal(normalizeMessageTimestamp(value), value);
  assert.match(formatMessageTime(value) ?? '', /^\d{2}:\d{2}$/);
});

test('missing and invalid timestamps stay hidden instead of throwing', () => {
  assert.equal(formatMessageTime(undefined), null);
  assert.equal(formatMessageTime(''), null);
  assert.equal(formatMessageTime('invalid'), null);
});

test('server timestamp falls back to the valid optimistic timestamp', () => {
  const optimistic = '2026-09-02T12:34:56.000Z';
  assert.equal(normalizeMessageTimestamp(undefined, optimistic), optimistic);
  assert.equal(normalizeMessageTimestamp('', optimistic), optimistic);
  assert.equal(normalizeMessageTimestamp('invalid', optimistic), optimistic);
});
