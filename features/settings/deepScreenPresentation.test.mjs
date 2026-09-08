import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const tr = read('../../localization/messages/tr.ts');
const en = read('../../localization/messages/en.ts');
const form = read('../astrology/BirthChartForm.tsx');
const birth = read('../../app/birth-chart.tsx');
const home = read('../../app/(tabs)/index.tsx');
const ask = read('../../app/ask.tsx');
const profile = read('../../app/(tabs)/profile.tsx');
const placement = read('../astrology/FreePlacementTool.tsx');
const moonCalendar = read('../astrology/MoonCalendarExperience.tsx');
const access = read('../social/SocialAccessState.tsx');
const synastry = read('../synastry/SynastryExperience.tsx');
const soulmate = read('../social/SoulmateExperience.tsx');
const zodiacGroup = read('../social/ZodiacGroupExperience.tsx');
const composer = read('../social/ChatComposer.tsx');
const community = read('../social/CommunityExperience.tsx');
const compatibility = read('../../app/zodiac-compatibility.tsx');
const privateChat = read('../social/PrivateChatExperience.tsx');
const notifications = read('../social/SocialNotificationsPanel.tsx');
const soulmatePresentation = read('../social/soulmatePresentation.ts');
const chartResult = read('../../app/chart-result.tsx');
const lockedSection = read('../premium/LockedSection.tsx');
const premium = read('../../app/premium.tsx');
const questions = read('../../app/questions/index.tsx');
const fullChart = read('../../app/full-chart.tsx');
const premiumPreview = read('../../app/premium-preview.tsx');
const premiumPreviewContent = read('../premium/DevPremiumPreviewContent.tsx');
const placementComments = read('../astrology/placementComments.ts');

test('birth details chrome and validation are available in Turkish and English', () => {
  for (const value of ['DOĞUM HARİTASI','Doğum Tarihi','Doğum saatimi bilmiyorum']) assert.match(tr,new RegExp(value));
  for (const value of ['BIRTH CHART','Date of birth','I do not know my birth time','Select date','Select time']) assert.match(en,new RegExp(value));
  assert.match(birth,/messages\.birthForm/);
  assert.match(form,/m\.firstNameError/);
});

test('birth form controls use the resolved light or dark palette', () => {
  assert.match(form,/usePalette/);
  for (const token of ['palette.surface','palette.border','palette.navy','palette.muted','palette.sapphire']) assert.match(form,new RegExp(token.replace('.','\\.')));
});

test('Home hero title uses the resolved high-contrast primary text token', () => {
  assert.equal((home.match(/styles\.heroTitle, \{ color: palette\.navy \}/g) ?? []).length,2);
});

test('Ask required state is localized without changing catalog submit fields', () => {
  assert.match(ask,/messages\.birthRequired\.title/);
  assert.match(ask,/messages\.birthRequired\.description/);
  assert.match(ask,/messages\.birthRequired\.action/);
  assert.match(ask,/catalogId: selection\.item\.id/);
});

test('premium fixture remains development-only and is localized', () => {
  assert.match(profile,/if \(!__DEV__\) return null/);
  assert.match(profile,/messages\.dev\.premiumPreview/);
  assert.match(profile,/messages\.dev\.fixtureOnly/);
});

test('Moon, Venus and Rising share localized themed calculator chrome', () => {
  for (const key of ['p.moonTitle','p.venusTitle','p.ascendantTitle','p.calculate']) assert.match(placement,new RegExp(key.replace('.','\\.')));
  for (const token of ['palette.surface','palette.border','palette.navy','palette.muted']) assert.match(placement,new RegExp(token.replace('.','\\.')));
});

test('Moon Calendar uses locale formatters, translated phase labels and dark surfaces', () => {
  assert.match(moonCalendar,/messages\.moonCalendar/);
  assert.match(moonCalendar,/monthTitle\(month,intlLocale\)/);
  assert.match(moonCalendar,/phaseLabel\(phase\.label\)/);
  assert.match(moonCalendar,/backgroundColor:palette\.surface/);
});

test('Ask editor and confirmation consume localized themed chrome', () => {
  for (const key of ['askDeep.placeholder','askDeep.prepare','askDeep.confirm','askDeep.price','askDeep.balance','askDeep.info']) assert.match(ask,new RegExp(key.replace('.','\\.')));
  assert.match(ask,/backgroundColor:palette\.background/);
});

test('full-screen birth-required state is localized and themed', () => {
  assert.match(access,/messages\.accessRequired/);
  assert.match(access,/backgroundColor:palette\.surface/);
  assert.match(access,/color:palette\.navy/);
});

test('synastry, soulmate, zodiac group and composer use shared locale and palette', () => {
  for (const [source,key] of [[synastry,'messages.synastry'],[soulmate,'messages.soulmate'],[zodiacGroup,'catalog.zodiacGroup'],[composer,'messages.chat']]) {
    assert.match(source,new RegExp(key.replace('.','\\.'))); assert.match(source,/usePalette/);
  }
  assert.match(synastry,/__DEV__/); assert.match(zodiacGroup,/localizeZodiacSignForLocale/);
});

test('social onboarding and compatibility result chrome are localized and themed', () => {
  assert.match(community,/messages\.community/); assert.match(community,/usePalette/);
  for (const key of ['m.result','m.score','m.recalculate','m.premiumPrompt','m.premiumCta']) assert.match(compatibility,new RegExp(key.replace('.','\\.')));
  assert.match(compatibility,/backgroundColor:palette\.surface/);
  assert.match(tr,/community:/); assert.match(en,/community:/);
});

test('private chat labels and bubble states use locale and resolved palette',()=>{
  for(const key of ['m.you','m.sending','m.sendFailed','m.sendError']) assert.match(privateChat,new RegExp(key.replace('.','\\.')));
  for(const token of ['palette.surface','palette.border','palette.navy','palette.muted']) assert.match(privateChat,new RegExp(token.replace('.','\\.')));
});

test('notification relative time and soulmate categories are bilingual presentation',()=>{
  for(const key of ['m.minuteAgo','m.minutesAgo','m.hourAgo','m.hoursAgo','m.yesterday','m.daysAgo']) assert.match(notifications,new RegExp(key.replace('.','\\.')));
  assert.match(soulmatePresentation,/CATEGORY_LABELS_EN/); assert.match(soulmatePresentation,/locale:'tr'\|'en'/);
  assert.match(soulmate,/borderBottomColor:palette\.border/);
});

test('chart result locked sections are bilingual and use resolved card palette',()=>{
  assert.match(chartResult,/messages\.chartResultLocked/);
  for(const value of ['Your Natural Talents','Your Greatest Strengths and Challenges','Your Karmic Indicators','12-House Analysis']) assert.match(en,new RegExp(value));
  for(const token of ['palette.surface','palette.border','palette.navy','palette.muted']) assert.match(lockedSection,new RegExp(token.replace('.','\\.')));
});

test('premium paywall preserves product ids while localizing chrome and surfaces',()=>{
  assert.match(premium,/messages\.premiumScreen/);
  assert.match(premium,/PREMIUM_PRODUCT_ORDER/);
  assert.match(premium,/displayPrice\(product\.id\)/);
  for(const token of ['palette.surface','palette.border','palette.navy','palette.muted','palette.gold']) assert.match(premium,new RegExp(token.replace('.','\\.')));
  assert.match(en,/GET UNLIMITED MESSAGING/);
});

test('My Questions empty state and statuses are bilingual and themed',()=>{
  assert.match(questions,/messages\.questionsList/);
  assert.match(en,/You don't have any questions to track yet/);
  assert.match(tr,/Henüz takip ettiğin bir sorun yok/);
  assert.match(questions,/backgroundColor:palette\.surface/);
});

test('synastry unknown-time row uses resolved dark-safe surface and switch colors',()=>{
  assert.match(synastry,/backgroundColor:palette\.surface/);
  assert.match(synastry,/trackColor=\{\{ false: palette\.border, true: palette\.sapphire \}\}/);
  assert.match(en,/placeMine:'Place of Birth'/);
});

test('Chart Result free placements are bilingual, zodiac-aware and dark-safe',()=>{
  assert.match(chartResult,/messages\.chartResultFree/);
  assert.match(chartResult,/localizeZodiacSignForLocale/);
  assert.match(chartResult,/getPlacementCommentForLocale/);
  for(const value of ['YOUR FREE CHART','Sun\|Moon\|Rising\|Mercury\|Venus\|Mars','UNLOCK MY FULL CHART','View All Premium Sections']) assert.match(en,new RegExp(value));
  assert.match(placementComments,/planetFocusEn/);
  for(const token of ['backgroundColor:palette.surface','borderColor:palette.border','color:palette.navy','color:palette.muted']) assert.match(chartResult,new RegExp(token.replace('.','\\.')));
});

test('development Premium Preview localizes chrome and resolves light or dark surfaces',()=>{
  assert.match(fullChart,/messages\.premiumPreview/);
  for(const value of ['Premium Preview','Your Complete Birth Chart','My Chart Indicators','My Deep Character Analysis','What Does My Chart Say About Me','Chart Wheel','Technical natal chart']) assert.match(en,new RegExp(value,'i'));
  for(const token of ['backgroundColor:palette.surface','borderColor:palette.border','color:palette.navy','color:palette.muted']) assert.match(fullChart,new RegExp(token.replace('.','\\.')));
  assert.match(premiumPreview,/if \(!__DEV__\) return/);
  assert.doesNotMatch(premiumPreviewContent,/purchase\(|credit|balance/i);
});
