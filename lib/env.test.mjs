import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('./env.ts', import.meta.url), 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;

function load(rawValue) {
  const module = { exports: {} };
  const env = rawValue === undefined ? {} : { EXPO_PUBLIC_API_BASE_URL: rawValue };
  vm.runInNewContext(output, { module, exports: module.exports, process: { env }, URL, Error });
  return module.exports;
}

for (const [name, rawValue, expected] of [
  ['undefined uses production fallback', undefined, 'https://safircan.com'],
  ['empty uses production fallback', '', 'https://safircan.com'],
  ['whitespace uses production fallback', '   ', 'https://safircan.com'],
  ['production origin is accepted', 'https://safircan.com', 'https://safircan.com'],
  ['production slash is normalized', 'https://safircan.com/', 'https://safircan.com'],
  ['staging origin is accepted', 'https://staging.example.com', 'https://staging.example.com'],
  ['staging slash is normalized', ' https://staging.example.com/ ', 'https://staging.example.com'],
]) {
  test(name, () => {
    const { publicConfig, resolveApiBaseUrl } = load(rawValue);
    assert.equal(publicConfig.apiBaseUrl, expected);
    assert.equal(resolveApiBaseUrl(rawValue), expected);
  });
}

for (const [name, rawValue] of [
  ['API path', 'https://staging.example.com/api'],
  ['other path', 'https://staging.example.com/foo'],
  ['multiple root slashes', 'https://staging.example.com///'],
  ['HTTP protocol', 'http://staging.example.com'],
  ['FTP protocol', 'ftp://staging.example.com'],
  ['relative URL', '/api'],
  ['username', 'https://user@staging.example.com'],
  ['password', 'https://user:secret@staging.example.com'],
  ['query', 'https://staging.example.com?mode=test'],
  ['hash', 'https://staging.example.com#test'],
  ['malformed URL', 'not a url'],
]) {
  test(`rejects ${name}`, () => {
    assert.throws(() => load(rawValue), error => error?.message === 'invalid_api_base_url');
  });
}
