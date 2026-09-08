import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const tr = read('../../localization/messages/tr.ts');
const en = read('../../localization/messages/en.ts');
const home = read('../../app/(tabs)/index.tsx');
const chart = read('../../app/(tabs)/chart.tsx');
const discover = read('../../app/(tabs)/discover.tsx');
const ask = read('../../app/ask.tsx');
const profile = read('../../app/(tabs)/profile.tsx');
const tabs = read('../../components/GlobalTabBar.tsx');
const sectionHeader = read('../../components/SectionHeader.tsx');
const theme = read('../../constants/theme.ts');
const domain = read('./domain.ts');

test('home, chart, discover, ask and profile consume the shared locale catalog', () => {
  for (const source of [home, chart, discover, ask, profile]) assert.match(source, /useLocale/);
  for (const key of ['home:', 'chart:', 'discover:', 'ask:', 'profileMain:']) {
    assert.match(tr, new RegExp(key));
    assert.match(en, new RegExp(key));
  }
});

test('English catalog includes natural product names and all thirteen Ask titles', () => {
  for (const title of ['Rising Sign', 'Moon Sign', 'Venus Sign', 'Zodiac Compatibility', 'Professional Synastry', 'Daily Transits', 'Moon Calendar']) assert.match(en, new RegExp(title));
  const questionLine = en.match(/questionTitles:\s*'([^']+)'/)?.[1] ?? '';
  assert.equal(questionLine.split('|').length, 13);
});

test('shared navigation and major surfaces resolve from the active locale and palette', () => {
  assert.match(tabs, /messages\.nav\[tab\.id\]/);
  for (const source of [home, chart, discover, ask, profile, sectionHeader]) assert.match(source, /usePalette/);
});

test('light, dark and system palettes remain explicit and system resolution is delegated to the shared domain', () => {
  assert.match(theme, /background:\s*'#F7F3EA'/);
  assert.match(theme, /background:\s*'#0D1424'/);
  assert.match(theme, /surface:\s*'#151F32'/);
  assert.match(domain, /theme === 'system' \? systemScheme : theme/);
});
