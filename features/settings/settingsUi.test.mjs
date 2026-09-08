import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const root = readFileSync(new URL('../../app/_layout.tsx', import.meta.url), 'utf8');
const screen = readFileSync(new URL('../../components/Screen.tsx', import.meta.url), 'utf8');
const tabs = readFileSync(new URL('../../components/GlobalTabBar.tsx', import.meta.url), 'utf8');
const settings = readFileSync(new URL('../../app/settings.tsx', import.meta.url), 'utf8');

test('resolved theme drives the root shell, status bar, screens and bottom tabs', () => {
  assert.match(root, /const \{ colorScheme, locale \} = useLocale\(\)/);
  assert.match(root, /StatusBar style=\{colorScheme === 'dark' \? 'light' : 'dark'\}/);
  assert.match(screen, /const \{ colorScheme \} = useLocale\(\)/);
  assert.match(tabs, /const \{ colorScheme, messages \} = useLocale\(\)/);
});

test('settings uses one compact custom header and modal selectors', () => {
  assert.match(root, /name="settings" options=\{\{ headerShown: false \}\}/);
  assert.match(settings, /<Modal/);
  assert.match(settings, /minHeight: 48/);
  assert.doesNotMatch(settings, /settings-outline/);
});

test('settings scroll provides explicit bottom spacing above global navigation', () => {
  assert.match(settings, /<Screen bottomPadding=\{24\}>/);
});
