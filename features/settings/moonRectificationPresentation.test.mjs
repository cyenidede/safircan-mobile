import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('Moon Calendar localizes all lunar phases, zodiac presentation and event meanings', () => {
  const screen = read('features/astrology/MoonCalendarExperience.tsx');
  const en = read('localization/messages/en.ts');
  for (const label of ['New Moon','Waxing Crescent','First Quarter','Waxing Gibbous','Full Moon','Waning Gibbous','Last Quarter','Waning Crescent']) assert.match(en, new RegExp(label));
  assert.match(screen, /localizeZodiacSignForLocale/);
  assert.match(screen, /meaningLabel/);
  assert.match(en, /Release, simplify, and reassess\./);
  assert.match(en, /New intentions and new beginnings\./);
  assert.match(en, /Take action and turn decisions into concrete steps\./);
});

test('rectification presentation is locale-aware and uses resolved surfaces', () => {
  const presentation = read('features/rectification/presentation.ts');
  const landing = read('app/rectification.tsx');
  const form = read('app/rectification-form.tsx');
  const review = read('app/rectification-review.tsx');
  const result = read('features/rectification/RectificationResultCard.tsx');
  const upsell = read('app/rectification-upsell.tsx');
  assert.match(presentation, /BIRTH TIME RECTIFICATION/);
  assert.match(presentation, /START THE 8-STEP FORM/);
  assert.match(presentation, /Review My Answers/);
  for (const source of [landing, form, review, result, upsell]) assert.match(source, /usePalette/);
  for (const source of [landing, form, review, result, upsell]) assert.match(source, /useRectificationText/);
  assert.match(result, /localizeZodiacSignForLocale/);
});

test('rectification purchase contract remains canonical', () => {
  const landing = read('app/rectification.tsx');
  const products = read('constants/products.ts');
  assert.match(landing, /hasEntitlement\('birth_time_rectification'\)/);
  assert.match(landing, /purchase\(product\.id\)/);
  assert.match(landing, /displayPrice\(product\.id\)/);
  assert.match(products, /birth_time_rectification/);
  assert.match(products, /499 TL/);
});
