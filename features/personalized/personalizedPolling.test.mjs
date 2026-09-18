import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
function loadTs(source, require = () => ({})) { const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText; const module = { exports: {} }; vm.runInNewContext(output, { module, exports: module.exports, require, Object, Set, Error }); return module.exports; }
const domain = loadTs(read('./domain.ts'));
const hook = read('./usePersonalizedCurrent.ts');
class MockApiRequestError extends Error { constructor(kind, status) { super(kind); this.kind = kind; this.status = status; } }
const stateMachine = loadTs(hook, (name) => {
  if (name === '@/lib/api') return { ApiRequestError: MockApiRequestError };
  if (name === './domain') return domain;
  if (name === 'react') return { useCallback: (value) => value, useEffect: () => {}, useMemo: (value) => value(), useRef: (current) => ({ current }), useState: (value) => [typeof value === 'function' ? value() : value, () => {}] };
  if (name === 'react-native') return { AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) } };
  if (name === 'expo-router') return { useFocusEffect: () => {} };
  return {};
});
const result = (status, unlocked = true) => ({ status, access: { unlocked } });

test('polling starts only for unlocked processing', () => { assert.equal(domain.shouldPollPersonalized(result('processing')), true); assert.equal(domain.shouldPollPersonalized(result('processing', false)), false); for (const status of ['ready', 'unavailable', 'preview_ready']) assert.equal(domain.shouldPollPersonalized(result(status)), false); });
test('polling constants are 10 seconds, 2 minutes and 12 polls', () => { assert.equal(domain.PERSONALIZED_POLL_DELAY_MS, 10_000); assert.equal(domain.PERSONALIZED_POLL_WINDOW_MS, 120_000); assert.equal(domain.PERSONALIZED_MAX_POLLS, 12); });
test('gate prevents duplicate schedules and caps nominal polls', () => { let now = 0; const gate = domain.createPersonalizedPollingGate(() => now); for (let index = 0; index < 12; index += 1) { assert.equal(gate.begin(result('processing')), true); assert.equal(gate.begin(result('processing')), false); assert.equal(gate.consume(), true); } assert.equal(gate.begin(result('processing')), false); });
test('gate caps continuous window and reset permits a fresh cycle', () => { let now = 0; const gate = domain.createPersonalizedPollingGate(() => now); assert.equal(gate.begin(result('processing')), true); gate.consume(); now = 120_000; assert.equal(gate.begin(result('processing')), false); gate.cancel(); assert.equal(gate.begin(result('processing')), true); });
test('recursive settled cadence uses setTimeout and never setInterval', () => { assert.match(hook, /setTimeout\(\(\) =>/); assert.match(hook, /PERSONALIZED_POLL_DELAY_MS/); assert.doesNotMatch(hook, /setInterval/); assert.match(hook, /await getPersonalizedCurrent[\s\S]+schedule\(kind, result\)/); });
test('one active request per kind aborts prior work and rejects stale responses', () => { assert.match(hook, /controllers\.current\[kind\]\?\.abort\(\)/); assert.match(hook, /generations\.current\.isCurrent\(kind, ticket\)/); assert.match(hook, /controller\.signal\.aborted/); });
test('terminal, locked and error responses stop polling', () => { assert.match(hook, /shouldPollPersonalized\(result\)/); assert.match(hook, /gates\.current\[kind\]\.cancel\(\)/); });
test('background, blur and unmount cancel timers and requests', () => { assert.match(hook, /next !== 'active'\) cancelAll\(\)/); assert.match(hook, /return \(\) => \{\s*focusedRef\.current = false;\s*cancelAll\(\)/); assert.match(hook, /mountedRef\.current = false/); assert.match(hook, /clearTimeout\(timer\)/); });
test('foreground and focus perform a fresh GET before resuming', () => { assert.match(hook, /else if \(!wasActive && focusedRef\.current\) refreshAll\(\)/); assert.match(hook, /focusedRef\.current = true;[\s\S]+refreshAll\(\)/); assert.match(hook, /loadKind\(kind, true\)/); });
test('manual refresh resets the bounded polling window', () => { assert.match(hook, /const refresh = useCallback\(\(kind: PersonalizedKind\) => loadKind\(kind, true\)/); });
test('weekly, monthly and Sky timers are isolated', () => { for (const kind of ['weekly', 'monthly', 'sky_answer']) assert.match(hook, new RegExp(`${kind}: createPersonalizedPollingGate\\(\\)`)); assert.match(hook, /Partial<Record<PersonalizedKind, ReturnType<typeof setTimeout>>>/); });
test('authorization failures behaviorally require account-wide cancellation with no retry', () => {
  const initial = stateMachine.emptyPersonalizedState();
  for (const failure of ['auth_required', 'account_unavailable']) {
    const transition = stateMachine.transitionPersonalizedFailure(initial, 'weekly', failure);
    assert.equal(transition.cancelAll, true);
    assert.equal(transition.retry, false);
  }
});
test('generation invalidation behaviorally blocks every stale late response', () => {
  const gate = stateMachine.createPersonalizedGenerationGate();
  const tickets = Object.fromEntries(['weekly', 'monthly', 'sky_answer'].map((kind) => [kind, gate.current(kind)]));
  gate.invalidateAll();
  for (const kind of ['weekly', 'monthly', 'sky_answer']) assert.equal(gate.isCurrent(kind, tickets[kind]), false);
});
