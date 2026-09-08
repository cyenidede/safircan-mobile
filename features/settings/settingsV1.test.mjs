import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { deserializePreferences, resolveLocale, resolveTheme, serializePreferences } from './domain.ts';

const api = readFileSync(new URL('./api.ts', import.meta.url), 'utf8');
const domain = readFileSync(new URL('./domain.ts', import.meta.url), 'utf8');
const provider = readFileSync(new URL('../../localization/index.tsx', import.meta.url), 'utf8');

test('settings API serializes only the five writable preference fields', () => {
  for (const field of ['preferred_locale', 'locale_source', 'theme', 'hide_last_name', 'auto_accept_group_invites']) assert.match(domain, new RegExp(field));
  for (const field of ['user_id', 'suspended_at', 'deletion_requested_at', 'created_at', 'updated_at']) assert.doesNotMatch(api, new RegExp(field));
  assert.match(api, /method: 'PATCH'/);
  assert.match(api, /\[settings-debug\] request/);
  assert.doesNotMatch(api, /console\.(?:info|log).*token/);
});

test('settings deserialization validates locale source, theme, booleans and account status', () => {
  assert.match(domain, /deserializePreferences/);
  assert.match(domain, /row\.locale_source !== 'system'/);
  assert.match(domain, /row\.theme !== 'system'/);
  assert.match(domain, /typeof row\.hide_last_name !== 'boolean'/);
  assert.match(domain, /deletion_pending/);
});

test('settings serialization and deserialization preserve the writable snapshot only', () => {
  const domainValue = { preferredLocale: 'en', localeSource: 'manual', theme: 'dark', hideLastName: true, autoAcceptGroupInvites: false, accountStatus: 'suspended' };
  assert.deepEqual(serializePreferences(domainValue), {
    preferred_locale: 'en', locale_source: 'manual', theme: 'dark', hide_last_name: true, auto_accept_group_invites: false,
  });
  assert.deepEqual(deserializePreferences({ ...serializePreferences(domainValue), account_status: 'suspended' }), domainValue);
  assert.equal(deserializePreferences({ ...serializePreferences(domainValue), theme: 'invalid', account_status: 'active' }), null);
});

test('PATCH success updates global state and persists the returned choice', () => {
  assert.match(provider, /setLocalePreference/);
  assert.match(provider, /preferredLocale: next === 'system' \? null : next/);
  assert.match(provider, /setPreferences\(next\)/);
  assert.match(provider, /await savePreferences\(token, next\)/);
  assert.match(provider, /AsyncStorage\.setItem\(storageKey, JSON\.stringify\(next\)\)/);
});

test('PATCH failure rolls global and cached state back', () => {
  assert.match(provider, /const previous = stateRef\.current/);
  assert.match(provider, /setPreferences\(previous\)/);
  assert.match(provider, /JSON\.stringify\(previous\)/);
});

test('reload restores the server preference and updates the cache', () => {
  assert.match(provider, /const next = await getPreferences\(token\)/);
  assert.match(provider, /setPreferences\(next\)/);
  assert.match(provider, /setCacheReady\(true\)/);
});

test('duplicate save requests are rejected by a synchronous guard', () => {
  assert.match(provider, /savingRef\.current/);
  assert.match(provider, /if \(!token \|\| savingRef\.current\) return false/);
  assert.match(provider, /savingRef\.current = true/);
});

test('theme resolution follows system light and dark or explicit choice', () => {
  assert.equal(resolveTheme('system', 'light'), 'light');
  assert.equal(resolveTheme('system', 'dark'), 'dark');
  assert.equal(resolveTheme('light', 'dark'), 'light');
  assert.equal(resolveTheme('dark', 'light'), 'dark');
});

test('locale resolution follows Turkish and English system locale or manual choice', () => {
  assert.equal(resolveLocale('system', null, 'tr'), 'tr');
  assert.equal(resolveLocale('system', null, 'en'), 'en');
  assert.equal(resolveLocale('manual', 'tr', 'en'), 'tr');
  assert.equal(resolveLocale('manual', 'en', 'tr'), 'en');
});
