import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const entitlement = readFileSync(new URL('./premium/EntitlementProvider.tsx', import.meta.url), 'utf8');
const social = readFileSync(new URL('./social/api.ts', import.meta.url), 'utf8');

test('authenticated startup APIs share the canonical API authority', () => {
  for (const source of [entitlement, social]) {
    assert.match(source, /import \{ API_BASE_URL \} from '@\/lib\/api';/);
    assert.doesNotMatch(source, /https:\/\/safircan\.com\/api/);
  }
  assert.doesNotMatch(social, /const API_BASE_URL\s*=/);
});

test('entitlement startup request preserves its path bearer and response behavior', () => {
  assert.match(entitlement, /fetch\(`\$\{API_BASE_URL\}\/api\/entitlements`/);
  assert.match(entitlement, /Authorization: `Bearer \$\{session\.access_token\}`/);
  assert.match(entitlement, /!response\.ok \|\| !data\.success/);
  assert.match(entitlement, /\.filter\(\(item\): item is Entitlement/);
  assert.match(entitlement, /\.catch\(\(\) => setEntitlements\(\['free'\]\)\)/);
  assert.match(entitlement, /\.finally\(\(\) => setLoading\(false\)\)/);
});

test('social startup requests preserve bearer error and notification contracts', () => {
  assert.match(social, /fetch\(`\$\{API_BASE_URL\}\$\{path\}`/);
  assert.match(social, /Authorization: `Bearer \$\{token\}`/);
  assert.match(social, /data\.success === false/);
  assert.match(social, /throw new SocialApiError\(response\.status/);
  assert.match(social, /typeof data\.error === 'string'/);
  assert.match(social, /typeof data\.message === 'string'/);
  assert.match(social, /data\.usage as SocialUsage \| undefined/);
  assert.match(social, /socialRequest<[^\n]+>\(token, '\/api\/social\/notifications'\)/);
  assert.match(social, /socialRequest<\{ success: true \}>\(token, '\/api\/social\/push-token', \{ method: 'PUT'/);
  assert.match(social, /socialRequest<\{ success: true \}>\(token, '\/api\/social\/push-token', \{ method: 'DELETE'/);
});
