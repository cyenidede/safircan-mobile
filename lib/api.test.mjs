import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('./api.ts', import.meta.url), 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;

function load(apiBaseUrl, fetch) {
  const module = { exports: {} };
  const require = name => {
    if (name === '@/lib/env') return { publicConfig: { apiBaseUrl } };
    throw new Error(`unexpected_import:${name}`);
  };
  vm.runInNewContext(output, { module, exports: module.exports, require, fetch, AbortController, setTimeout, clearTimeout, Error });
  return module.exports;
}

const response = (data = { ok: true }) => ({ ok: true, status: 200, json: async () => data });

test('production fallback origin joins an /api path once', async () => {
  let call;
  const client = load('https://safircan.com', async (url, init) => { call = { url, init }; return response(); });
  await client.requestJson('/api/example', { method: 'GET', headers: { Authorization: 'Bearer token', Accept: 'application/json' } });
  assert.equal(call.url, 'https://safircan.com/api/example');
  assert.equal(call.init.method, 'GET');
  assert.equal(call.init.headers.Authorization, 'Bearer token');
  assert.equal(call.init.headers.Accept, 'application/json');
});

test('staging origin joins an /api path without /api/api', async () => {
  let url;
  const client = load('https://staging.example.com', async value => { url = value; return response(); });
  await client.requestJson('/api/example', { method: 'GET' });
  assert.equal(url, 'https://staging.example.com/api/example');
  assert.doesNotMatch(url, /\/api\/api\//);
});

test('external AbortSignal aborts the internal request signal', async () => {
  const external = new AbortController();
  let requestSignal;
  const client = load('https://staging.example.com', (_url, init) => new Promise((_resolve, reject) => {
    requestSignal = init.signal;
    init.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
  }));
  const pending = client.requestJson('/api/example', { method: 'GET', signal: external.signal });
  external.abort();
  await assert.rejects(pending, error => error?.kind === 'network');
  assert.equal(requestSignal.aborted, true);
});

test('timeout aborts the request and preserves ApiRequestError mapping', async () => {
  let requestSignal;
  const client = load('https://staging.example.com', (_url, init) => new Promise((_resolve, reject) => {
    requestSignal = init.signal;
    init.signal.addEventListener('abort', () => reject(new Error('timeout')), { once: true });
  }));
  await assert.rejects(client.requestJson('/api/example', { method: 'GET' }, 1), error => error?.kind === 'network');
  assert.equal(requestSignal.aborted, true);
});

test('HTTP status mapping remains compatible', async () => {
  for (const [status, kind] of [[401, 'unauthorized'], [403, 'forbidden'], [422, 'place'], [500, 'response']]) {
    const client = load('https://staging.example.com', async () => ({ ok: false, status, json: async () => ({}) }));
    await assert.rejects(client.requestJson('/api/example', { method: 'GET' }), error => error?.kind === kind && error?.status === status);
  }
});
