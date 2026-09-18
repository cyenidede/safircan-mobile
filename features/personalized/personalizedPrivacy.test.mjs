import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const domain = read('./domain.ts');
const api = read('./api.ts');
const hook = read('./usePersonalizedCurrent.ts');
const ui = read('./PersonalizedHomeSection.tsx');
const lib = read('../../lib/api.ts');
const sources = domain + api + hook + ui;
function loadTs(source, require = () => ({})) { const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText; const module = { exports: {} }; vm.runInNewContext(output, { module, exports: module.exports, require, Object, Set, Error }); return module.exports; }
const domainModule = loadTs(domain);
class MockApiRequestError extends Error { constructor(kind, status) { super(kind); this.kind = kind; this.status = status; } }
const machine = loadTs(hook, (name) => {
  if (name === '@/lib/api') return { ApiRequestError: MockApiRequestError };
  if (name === './domain') return domainModule;
  if (name === 'react') return { useCallback: (value) => value, useEffect: () => {}, useMemo: (value) => value(), useRef: (current) => ({ current }), useState: (value) => [typeof value === 'function' ? value() : value, () => {}] };
  if (name === 'react-native') return { AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) } };
  if (name === 'expo-router') return { useFocusEffect: () => {} };
  return {};
});
const ready = (kind) => ({ success: true, kind, status: 'ready', access: { unlocked: true }, content: { fullResult: { secret: kind } } });
const readyState = () => ({ weekly: { data: ready('weekly'), loading: false, error: null }, monthly: { data: ready('monthly'), loading: false, error: null }, sky_answer: { data: ready('sky_answer'), loading: false, error: null } });

test('access loss replaces data and therefore clears stale fullResult', () => { assert.match(hook, /\[kind\]: \{ data: result, loading: false, error: null \}/); assert.doesNotMatch(hook, /fullResult:\s*current/); });
test('logout and account or locale switch clear every kind immediately', () => { assert.match(hook, /ownerRef\.current = owner;\s*cancelAll\(\);\s*setBlockingIssue\(null\);\s*setState\(emptyPersonalizedState\(\)\)/); assert.match(hook, /ownerMatches \? state : emptyPersonalizedState\(\)/); });
test('personalized full results have no persistent cache', () => { assert.doesNotMatch(sources, /AsyncStorage|SecureStore|SQLite|FileSystem|localStorage|persist/i); });
test('no response body, content, token, user or birth data logging exists', () => { assert.doesNotMatch(sources, /console\.|logger|analytics|birthData|birth_profile/); assert.doesNotMatch(lib, /console\./); });
test('no financial mutation or unlock creation exists', () => { assert.doesNotMatch(sources, /reserve|capture|release|debit|purchase|transaction|stars\/|balance|price/i); assert.match(api, /method: 'GET'/); assert.doesNotMatch(api, /POST|PATCH|PUT|DELETE/); });
test('Premium and full_chart are not authorization inputs', () => { assert.doesNotMatch(sources, /useEntitlements|hasEntitlement|full_chart|safircan_premium/); assert.match(domain, /value\.access\.unlocked/); });
test('Sky authorization uses only the server DTO and informational navigation', () => { assert.match(ui, /kind === 'sky_answer' \? '\/ask' : '\/premium'/); assert.doesNotMatch(ui, /setUnlocked|unlockSky/); });
test('identifiers and internal metadata are absent from accepted domain types', () => { for (const forbidden of ['contentId', 'jobId', 'userId', 'providerMetadata', 'generationMetadata', 'rawModelResponse', 'evidence', 'fingerprint']) assert.doesNotMatch(domain, new RegExp(forbidden, 'i')); });
test('request query contains only kind and locale', () => { assert.match(api, /kind=\$\{encodeURIComponent\(kind\)\}&locale=\$\{encodeURIComponent\(locale\)\}/); assert.doesNotMatch(api, /user_id|content_id|job_id|premium|retryFailed/); });
test('AbortSignal is forwarded through the shared API client', () => { assert.match(api, /signal,/); assert.match(lib, /externalSignal\?\.addEventListener\('abort'/); assert.match(lib, /externalSignal\?\.removeEventListener\('abort'/); });
test('401 behaviorally clears weekly, monthly and Sky full results immediately', () => {
  const failure = machine.classifyPersonalizedFailure(new MockApiRequestError('unauthorized', 401));
  const transition = machine.transitionPersonalizedFailure(readyState(), 'weekly', failure);
  assert.equal(failure, 'auth_required');
  for (const kind of ['weekly', 'monthly', 'sky_answer']) assert.equal(transition.state[kind].data, null);
  assert.equal(transition.blockingIssue, 'auth_required');
});
test('401 from polling or manual refresh cancels all, retries none and invalidates stale responses', () => {
  const gate = machine.createPersonalizedGenerationGate(); const ticket = gate.current('weekly');
  const transition = machine.transitionPersonalizedFailure(readyState(), 'weekly', 'auth_required');
  if (transition.cancelAll) gate.invalidateAll();
  assert.equal(transition.retry, false); assert.equal(gate.isCurrent('weekly', ticket), false); assert.equal(transition.state.weekly.data, null);
});
test('403 behaviorally clears all full results and exposes only lifecycle-safe state', () => {
  const failure = machine.classifyPersonalizedFailure(new MockApiRequestError('forbidden', 403));
  const transition = machine.transitionPersonalizedFailure(readyState(), 'sky_answer', failure);
  assert.equal(failure, 'account_unavailable'); assert.equal(transition.cancelAll, true); assert.equal(transition.retry, false);
  for (const kind of ['weekly', 'monthly', 'sky_answer']) assert.equal(transition.state[kind].data, null);
  assert.equal(transition.blockingIssue, 'account_unavailable');
});
test('403 invalidation prevents a stale later success from restoring content', () => {
  const gate = machine.createPersonalizedGenerationGate(); const ticket = gate.current('monthly'); gate.invalidateAll();
  assert.equal(gate.isCurrent('monthly', ticket), false);
});
test('503 and network failures remain differentiated retry states, never auth blocks', () => {
  const unavailable = machine.classifyPersonalizedFailure(new MockApiRequestError('response', 503));
  const network = machine.classifyPersonalizedFailure(new MockApiRequestError('network'));
  assert.equal(unavailable, 'temporary_unavailable'); assert.equal(network, 'network');
  for (const failure of [unavailable, network]) { const transition = machine.transitionPersonalizedFailure(readyState(), 'weekly', failure); assert.equal(transition.cancelAll, false); assert.equal(transition.retry, false); assert.equal(transition.blockingIssue, null); assert.equal(transition.state.weekly.data, null); }
});
test('UI gives authorization errors precedence over card data and exposes no raw status', () => { assert.match(ui, /if \(blockingIssue\) return/); assert.match(ui, /if \(value\.error\) return/); assert.doesNotMatch(ui, /blockingIssue.*status|error\.status/); });
