import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { defaultUserPreferences } from './domain.ts';

const provider = readFileSync(
  new URL('../../localization/index.tsx', import.meta.url),
  'utf8'
);

test('fresh install defaults to Turkish', () => {
  assert.equal(defaultUserPreferences.localeSource, 'manual');
  assert.equal(defaultUserPreferences.preferredLocale, 'tr');
});

test('system language is read from expo-localization', () => {
  assert.match(provider, /from ['"]expo-localization['"]/);
  assert.match(provider, /getLocales\(\)/);
  assert.doesNotMatch(
    provider,
    /Intl\.DateTimeFormat\(\)\.resolvedOptions\(\)\.locale/
  );
});

test('legacy v1 locale cache is not reused after Turkish-default migration', () => {
  assert.match(provider, /safircan\.preferences\.v2/);
  assert.doesNotMatch(provider, /safircan\.preferences\.v1/);
  assert.doesNotMatch(provider, /v2-test/);
});