import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const read=(path)=>readFileSync(new URL(path,import.meta.url),'utf8');
const settings=read('../../app/settings.tsx');
const screen=read('../../app/legal/[document].tsx');
const documents=read('../legal/documents.ts');
const layout=read('../../app/_layout.tsx');
const tabs=read('../../components/GlobalTabBar.tsx');
const tr=read('../../localization/messages/tr.ts');
const en=read('../../localization/messages/en.ts');
test('Settings legal rows navigate only to internal routes',()=>{
  for(const route of ['/legal/privacy','/legal/terms','/legal/kvkk']) assert.match(settings,new RegExp(route.replaceAll('/','\\/')));
  assert.doesNotMatch(settings,/Linking\.openURL/);
});
test('legal documents use one canonical allowlist and reject arbitrary ids',()=>{
  for(const url of ['https://safircan.com/gizlilik','https://safircan.com/kullanim-kosullari','https://safircan.com/aydinlatma-metni']) assert.match(documents,new RegExp(url.replaceAll('/','\\/')));
  assert.match(documents,/isLegalDocumentId/); assert.match(screen,/LEGAL_DOCUMENTS\[id\]\.url/);
});
test('legal screen has bilingual chrome, palette, back, loading, error and explicit web fallback',()=>{
  for(const value of ['Privacy Policy','Terms of Use','Privacy Notice / KVKK','View web version']) assert.match(en,new RegExp(value));
  for(const value of ['Gizlilik Politikası','Kullanım Koşulları','KVKK / Aydınlatma Metni','Web sürümünü görüntüle']) assert.match(tr,new RegExp(value));
  for(const token of ['palette.surface','palette.border','palette.navy','palette.muted','palette.sapphire']) assert.match(screen,new RegExp(token.replace('.','\\.')));
  assert.match(screen,/router\.back\(\)/); assert.match(screen,/loading\?/); assert.match(screen,/error\?/);
  assert.match(screen,/onPress=\{\(\)=>void Linking\.openURL/);
});
test('legal detail hides global tabs and is registered without a duplicate header',()=>{
  assert.match(tabs,/pathname\.startsWith\('\/legal\/'\)/);
  assert.match(layout,/name="legal\/\[document\]" options=\{\{ headerShown: false \}\}/);
});
