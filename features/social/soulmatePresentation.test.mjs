import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('./soulmatePresentation.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, { exports: module.exports, module });
const { mergeSoulmateCandidates, orderedMatchCategories, shouldShowSoulmateSummary, soulmateReason } = module.exports;

const match = (score, categories = []) => ({ score, categories });
const profile = (userId) => ({ userId });

test('four real categories use stable user-facing order and server levels', () => {
  const categories = orderedMatchCategories(match(88, [
    { id: 'communication', label: 'x', score: 84, level: 'Çok Güçlü' },
    { id: 'longTerm', label: 'x', score: 72, level: 'Güçlü' },
    { id: 'emotional', label: 'x', score: 78, level: 'Güçlü' },
    { id: 'attraction', label: 'x', score: 92, level: 'Çok Güçlü' },
  ]));
  assert.equal(categories.map((item) => item.id).join(','), 'attraction,emotional,communication,longTerm');
  assert.equal(categories[0].level, 'Çok Güçlü');
});

test('reason is deterministic and follows the strongest real categories', () => {
  const value = match(87, [
    { id: 'attraction', label: 'Çekim', score: 94, level: 'Çok Güçlü' },
    { id: 'emotional', label: 'Duygusal Uyum', score: 89, level: 'Çok Güçlü' },
  ]);
  assert.equal(soulmateReason(value), soulmateReason(value));
  assert.match(soulmateReason(value), /çekim/);
});

test('ten-candidate pagination merge removes duplicates and keeps stable descending scores', () => {
  const firstPage = Array.from({ length: 5 }, (_, index) => ({ profile: profile(`u${index + 1}`), match: match(90 - index) }));
  const secondPage = Array.from({ length: 6 }, (_, index) => ({ profile: profile(`u${index + 5}`), match: match(86 - index) }));
  const merged = mergeSoulmateCandidates(firstPage, secondPage);
  assert.equal(merged.length, 10);
  assert.equal(new Set(merged.map((item) => item.profile.userId)).size, 10);
  assert.equal(merged[0].profile.userId, 'u1');
  assert.equal(merged.at(-1).profile.userId, 'u10');
});

test('empty or zero-new-count result never shows a summary banner', () => {
  assert.equal(shouldShowSoulmateSummary(0, 0), false);
  assert.equal(shouldShowSoulmateSummary(0, 3), false);
  assert.equal(shouldShowSoulmateSummary(1, 0), false);
  assert.equal(shouldShowSoulmateSummary(1, 1), true);
});
