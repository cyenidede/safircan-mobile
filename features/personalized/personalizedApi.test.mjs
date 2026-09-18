import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
function loadTs(source, require = () => ({}), globals = {}) {
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, { module, exports: module.exports, require, Object, Set, Error, encodeURIComponent, ...globals });
  return module.exports;
}
const domainSource = read('./domain.ts');
const domain = loadTs(domainSource);
const apiSource = read('./api.ts');

const standardPreview = { headline: 'Headline', summary: 'Summary' };
const skyPreview = { headline: 'Question', hint: 'Hint' };
const weeklyMinimal = { preview: standardPreview, overview: 'Overview', mainTheme: { title: 'Theme', detail: 'Detail' }, importantDates: [], closing: 'Closing' };
const monthlyMinimal = { preview: standardPreview, overview: 'Overview', mainThemes: [], importantWindows: [], closing: 'Closing' };
const skyMinimal = { preview: skyPreview, full: { theme: 'Theme', answer: 'Answer', whyNow: 'Why', focus: 'Focus' } };

function response(kind, status, unlocked, fullResult) {
  const preview = kind === 'sky_answer' ? skyPreview : standardPreview;
  const content = { periodKey: 'period', periodStart: 'start', periodEnd: 'end', timezone: 'Europe/Istanbul', locale: 'tr', state: status, preview };
  if (fullResult !== undefined) content.fullResult = fullResult;
  return { success: true, kind, status, access: { unlocked }, content };
}
function validReady(kind) {
  return response(kind, 'ready', true, kind === 'weekly' ? weeklyMinimal : kind === 'monthly' ? monthlyMinimal : skyMinimal);
}
function rejects(value) { assert.throws(() => domain.parsePersonalizedCurrent(value), /invalid_personalized_response/); }

test('locked preview_ready parses', () => assert.equal(domain.parsePersonalizedCurrent(response('weekly', 'preview_ready', false)).status, 'preview_ready'));
test('authorized processing parses', () => assert.equal(domain.parsePersonalizedCurrent(response('monthly', 'processing', true)).status, 'processing'));
test('weekly, monthly and Sky ready parse', () => ['weekly', 'monthly', 'sky_answer'].forEach((kind) => assert.equal(domain.parsePersonalizedCurrent(validReady(kind)).kind, kind)));
test('authorized unavailable parses', () => assert.equal(domain.parsePersonalizedCurrent(response('sky_answer', 'unavailable', true)).status, 'unavailable'));
test('unknown kind and status reject', () => { rejects({ ...response('weekly', 'preview_ready', false), kind: 'daily' }); rejects({ ...response('weekly', 'preview_ready', false), status: 'queued' }); });
test('missing fields and state mismatch reject', () => { const missing = response('weekly', 'preview_ready', false); delete missing.content.periodKey; rejects(missing); const mismatch = response('weekly', 'preview_ready', false); mismatch.content.state = 'processing'; rejects(mismatch); });
test('invalid previews reject by kind', () => { const standard = response('weekly', 'preview_ready', false); standard.content.preview = skyPreview; rejects(standard); const sky = response('sky_answer', 'preview_ready', false); sky.content.preview = standardPreview; rejects(sky); });
test('ready requires access and fullResult', () => { rejects(response('weekly', 'ready', false, weeklyMinimal)); rejects(response('weekly', 'ready', true)); });
test('non-ready fullResult rejects', () => ['preview_ready', 'processing', 'unavailable'].forEach((status) => rejects(response('weekly', status, status !== 'preview_ready', weeklyMinimal))));
test('processing and unavailable require access', () => { rejects(response('weekly', 'processing', false)); rejects(response('weekly', 'unavailable', false)); });
test('content and job identifiers reject', () => { for (const key of ['id', 'contentId', 'jobId']) { const value = response('weekly', 'preview_ready', false); value.content[key] = 'secret'; rejects(value); } });

test('weekly accepts minimal and all optional fields', () => {
  assert.equal(domain.isWeeklyResult(weeklyMinimal), true);
  assert.equal(domain.isWeeklyResult({ ...weeklyMinimal, relationships: 'People', workAndMoney: 'Work', attention: 'Care', importantDates: [{ startDate: 'x', endDate: 'y', label: 'Date', guidance: 'Guide' }] }), true);
});
test('weekly rejects missing or malformed mainTheme', () => { const { mainTheme, ...missing } = weeklyMinimal; assert.equal(domain.isWeeklyResult(missing), false); assert.equal(domain.isWeeklyResult({ ...weeklyMinimal, mainTheme: { title: 'Theme' } }), false); });
test('weekly rejects malformed date, extra keys and null optional', () => {
  assert.equal(domain.isWeeklyResult({ ...weeklyMinimal, importantDates: [{ startDate: 'x', label: 'Date' }] }), false);
  assert.equal(domain.isWeeklyResult({ ...weeklyMinimal, evidence: 'internal' }), false);
  assert.equal(domain.isWeeklyResult({ ...weeklyMinimal, preview: { ...standardPreview, extra: true } }), false);
  assert.equal(domain.isWeeklyResult({ ...weeklyMinimal, attention: null }), false);
});
test('monthly accepts minimal and all optional fields', () => {
  assert.equal(domain.isMonthlyResult(monthlyMinimal), true);
  assert.equal(domain.isMonthlyResult({ ...monthlyMinimal, relationships: 'People', careerAndMoney: 'Career', attention: 'Care', mainThemes: [{ title: 'One', detail: 'Two' }], importantWindows: [{ startDate: 'x', endDate: 'y', title: 'Window', guidance: 'Guide' }] }), true);
});
test('monthly rejects malformed arrays, extra keys and null optional', () => {
  assert.equal(domain.isMonthlyResult({ ...monthlyMinimal, mainThemes: [{ title: 'Only' }] }), false);
  assert.equal(domain.isMonthlyResult({ ...monthlyMinimal, importantWindows: [{ startDate: 'x', title: 'Window' }] }), false);
  assert.equal(domain.isMonthlyResult({ ...monthlyMinimal, provider: 'internal' }), false);
  assert.equal(domain.isMonthlyResult({ ...monthlyMinimal, mainThemes: [{ title: 'One', detail: 'Two', extra: true }] }), false);
  assert.equal(domain.isMonthlyResult({ ...monthlyMinimal, careerAndMoney: null }), false);
});
test('Sky accepts minimal, caution and timeWindow', () => {
  assert.equal(domain.isSkyAnswerResult(skyMinimal), true);
  assert.equal(domain.isSkyAnswerResult({ ...skyMinimal, full: { ...skyMinimal.full, caution: 'Care' } }), true);
  assert.equal(domain.isSkyAnswerResult({ ...skyMinimal, full: { ...skyMinimal.full, timeWindow: { startDate: 'x', endDate: 'y', label: 'Soon' } } }), true);
});
test('Sky rejects missing focus, malformed window, extras and null optionals', () => {
  const { focus, ...withoutFocus } = skyMinimal.full;
  assert.equal(domain.isSkyAnswerResult({ ...skyMinimal, full: withoutFocus }), false);
  assert.equal(domain.isSkyAnswerResult({ ...skyMinimal, full: { ...skyMinimal.full, timeWindow: { startDate: 'x' } } }), false);
  assert.equal(domain.isSkyAnswerResult({ ...skyMinimal, full: { ...skyMinimal.full, raw: 'internal' } }), false);
  assert.equal(domain.isSkyAnswerResult({ ...skyMinimal, extra: true }), false);
  assert.equal(domain.isSkyAnswerResult({ ...skyMinimal, full: { ...skyMinimal.full, caution: null } }), false);
  assert.equal(domain.isSkyAnswerResult({ ...skyMinimal, full: { ...skyMinimal.full, timeWindow: null } }), false);
});
test('cross-kind structures reject', () => { assert.equal(domain.isMonthlyResult(weeklyMinimal), false); assert.equal(domain.isWeeklyResult(monthlyMinimal), false); assert.equal(domain.isWeeklyResult(skyMinimal), false); assert.equal(domain.isMonthlyResult(skyMinimal), false); });
test('strings are validated without normalization or invented date rules', () => { const value = { ...weeklyMinimal, overview: '  kept  ', importantDates: [{ startDate: 'not-an-iso-date', label: 'Date', guidance: 'Guide' }] }; assert.equal(domain.isWeeklyResult(value), true); assert.equal(value.overview, '  kept  '); });

test('API sends only kind and locale with bearer auth and AbortSignal', async () => {
  let call;
  const client = loadTs(apiSource, (name) => name === './domain' ? domain : { requestJson: async (path, init) => { call = { path, init }; return response('weekly', 'preview_ready', false); } });
  const signal = new AbortController().signal;
  await client.getPersonalizedCurrent('weekly', 'tr', 'token', signal);
  assert.equal(call.path, '/api/personalized/current?kind=weekly&locale=tr');
  assert.equal(call.init.method, 'GET');
  assert.equal(call.init.headers.Authorization, 'Bearer token');
  assert.equal(call.init.signal, signal);
  for (const forbidden of ['user_id', 'content_id', 'job_id', 'premium', 'unlocked', 'price', 'balance', 'retryFailed']) assert.doesNotMatch(call.path, new RegExp(forbidden, 'i'));
});
test('401, 403, 503 and network failures propagate without fallback data', async () => {
  for (const status of [401, 403, 503, 0]) {
    const client = loadTs(apiSource, (name) => name === './domain' ? domain : { requestJson: async () => { throw Object.assign(new Error('request'), { status }); } });
    await assert.rejects(client.getPersonalizedCurrent('weekly', 'en', 'token'));
  }
});
test('malformed API fullResult rejects', async () => {
  const client = loadTs(apiSource, (name) => name === './domain' ? domain : { requestJson: async () => response('weekly', 'ready', true, { ...weeklyMinimal, evidence: [] }) });
  await assert.rejects(client.getPersonalizedCurrent('weekly', 'tr', 'token'), /invalid_personalized_response/);
});
