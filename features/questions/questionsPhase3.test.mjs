import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
function loadTs(source, require = () => ({}), globals = {}) {
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, { module, exports: module.exports, require, globalThis: {}, Math, Object, Number, Error, AbortController, setTimeout, clearTimeout, ...globals });
  return module.exports;
}

const domainSource = read('./domain.ts');
const domain = loadTs(domainSource);
const apiSource = read('./api.ts');
const requestSource = read('./clientRequest.ts');
const requestGateSource = read('./requestGate.ts');
const api = loadTs(apiSource, (name) => name === './domain' ? domain : {});
const ask = read('../../app/ask.tsx');
const list = read('../../app/questions/index.tsx');
const detail = read('../../app/questions/[id].tsx');
const tabs = read('../../components/GlobalTabBar.tsx');
const provider = read('../social/SocialNotificationProvider.tsx');
const panel = read('../social/SocialNotificationsPanel.tsx');

const catalog = { items: [
  ['l1','love_relationship'],['l2','love_relationship'],['l3','love_relationship'],['l4','love_relationship'],
  ['c1','career'],['c2','career'],['c3','career'],['c4','career'],['m1','money'],['m2','money'],['y1','life'],['y2','life'],['y3','life'],
].map(([id, category], index) => ({ id, category, title: `Soru ${index + 1}`, requiresBirthTime: index % 2 === 0, starCost: 100, sortOrder: (index + 1) * 10 })) };

test('catalog normalizer loads all 13 server questions in sort order', () => { const items = api.normalizeCatalog(catalog); assert.equal(items.length, 13); assert.equal(items[0].id, 'l1'); assert.equal(items[12].id, 'y3'); });
test('catalog categories have only natural Turkish labels', () => { assert.deepEqual(Object.values(domain.CATEGORY_LABELS), ['Aşk & İlişkiler','İş & Kariyer','Para','Yaşam']); assert.doesNotMatch(JSON.stringify(domain.CATEGORY_LABELS), /relationship_return/); });
test('100 Stars display is sourced from catalog starCost', () => { assert.equal(api.normalizeCatalog(catalog)[0].starCost, 100); assert.match(ask, /item\.starCost/); });
test('balance loads from real Stars API and no local fake balance exists', () => { assert.match(apiSource, /\/api\/stars\/balance/); assert.doesNotMatch(ask, /useState\(\s*\d+\s*\)/); });
test('insufficient Stars disables submission and offers Stars store placeholder', () => { assert.match(ask, /balance < displayCost/); assert.match(ask, /Yıldız Al/); assert.doesNotMatch(ask, /purchase\(/); });
test('missing birth profile blocks submit and routes to birth chart', () => { assert.match(ask, /!profile/); assert.match(ask, /Doğum Bilgilerimi Tamamla/); assert.match(ask, /\/birth-chart/); });
test('prepared submit body exactly matches backend contract', async () => {
  let body;
  const mockFetch = async (_url, init) => { body = JSON.parse(init.body); return { ok:true, status:202, json:async()=>({ success:true, question:{ id:'00000000-0000-4000-8000-000000000001', status:'queued', starCost:100 }, balance:400 }) }; };
  const client = loadTs(apiSource, (name) => name === './domain' ? domain : {}, { fetch:mockFetch });
  const result = await client.submitQuestion('token', { clientRequestId:'00000000-0000-4000-8000-000000000002', catalogId:'career_change' }, 'İş değiştirmek için uygun dönemde miyim?');
  assert.equal(JSON.stringify(body), JSON.stringify({ clientRequestId:'00000000-0000-4000-8000-000000000002', catalogId:'career_change' }));
  assert.equal(result.title, 'İş değiştirmek için uygun dönemde miyim?');
  for (const forbidden of ['starCost','price','intent','amount','customQuestion']) assert.equal(Object.hasOwn(body, forbidden), false);
});
test('custom submit body exactly matches backend contract', async () => {
  let body;
  const mockFetch = async (_url, init) => { body = JSON.parse(init.body); return { ok:true, status:202, json:async()=>({ success:true, question:{ id:'00000000-0000-4000-8000-000000000003', status:'queued', starCost:100 }, balance:300 }) }; };
  const client = loadTs(apiSource, (name) => name === './domain' ? domain : {}, { fetch:mockFetch });
  await client.submitQuestion('token', { clientRequestId:'00000000-0000-4000-8000-000000000004', customQuestion:'Önümüzdeki aylarda neye odaklanmalıyım?' }, 'Önümüzdeki aylarda neye odaklanmalıyım?');
  assert.equal(JSON.stringify(body), JSON.stringify({ clientRequestId:'00000000-0000-4000-8000-000000000004', customQuestion:'Önümüzdeki aylarda neye odaklanmalıyım?' }));
  for (const forbidden of ['starCost','price','intent','amount','catalogId']) assert.equal(Object.hasOwn(body, forbidden), false);
});
test('custom question enforces trim-aware minimum and maximum', () => { assert.ok(domain.customQuestionError('kısa')); assert.equal(domain.customQuestionError('Yeterince uzun bir soru'), null); assert.ok(domain.customQuestionError('x'.repeat(501))); });
test('custom counter and 500 native limit are present', () => { assert.match(ask, /customText\.length/); assert.match(ask, /maxLength=\{CUSTOM_QUESTION_MAX\}/); });
test('double tap starts one action while failure retry keeps id and new confirmation changes it', async () => {
  let sequence=0; const client=loadTs(requestSource,()=>({randomUUID:()=>`id-${++sequence}`})); const tracker=client.createClientRequestTracker();
  const first=tracker.start(); assert.equal(tracker.current(),first); tracker.clear(); assert.notEqual(tracker.start(),first);
  const lock={current:false}; let release; let count=0; const pending=new Promise((resolve)=>{release=resolve;});
  const action=()=>{count+=1;return pending;}; const one=client.runWithSubmitLock(lock,action); const two=client.runWithSubmitLock(lock,action); assert.equal(count,1); assert.equal(await two,false); release(); assert.equal(await one,true);
  let retries=0; const retryId=tracker.start(); const failing=async()=>{retries+=1;throw new Error('network');}; await assert.rejects(client.runWithSubmitLock(lock,failing)); assert.equal(tracker.current(),retryId); await assert.rejects(client.runWithSubmitLock(lock,failing)); assert.equal(retries,2); assert.equal(tracker.current(),retryId);
});
test('feature unavailable has natural copy and raw code is not rendered', () => { assert.equal(domain.questionErrorMessage('feature_unavailable', 503), 'Safir’e Sor çok yakında kullanıma açılıyor.'); assert.doesNotMatch(ask, /\{(?:cause|code|failure_code|provider_error)\}/); });
test('all backend states map to Turkish copy', () => { assert.equal(JSON.stringify(domain.STATUS_LABELS), JSON.stringify({ queued:'Sırada', processing:'Hazırlanıyor', answered:'Cevap Hazır', failed:'Tamamlanamadı' })); });
test('failed state explains Stars release and retry returns to confirmation flow', () => { assert.match(detail, /Kullanılmayan Yıldızların bakiyene geri döndü/); assert.match(detail, /router\.push\('\/ask'/); });
test('questions list and detail use authenticated production endpoints', () => { assert.match(apiSource, /getQuestions[\s\S]+request<unknown>\('\/api\/questions'/); assert.match(apiSource, /\/api\/questions\/\$\{encodeURIComponent\(id\)\}/); assert.match(list, /STATUS_LABELS/); });
test('answered detail uses five natural sections and hides null values', () => { for (const label of ['Kısa Cevap','Detaylı Yorum','Zamanlama','Dikkat Etmen Gereken','Sonuç']) assert.match(detail, new RegExp(label)); assert.match(detail, /return content\?/); });
test('polling state rules stop terminal and background states', () => { assert.equal(domain.shouldPollQuestion('queued','active'), true); assert.equal(domain.shouldPollQuestion('processing','active'), true); assert.equal(domain.shouldPollQuestion('answered','active'), false); assert.equal(domain.shouldPollQuestion('failed','active'), false); assert.equal(domain.shouldPollQuestion('queued','background'), false); });
test('request gate is single-flight and rejects stale responses', () => { const gate=loadTs(requestGateSource).createRequestGate(); const first=gate.begin(); assert.equal(typeof first,'number'); assert.equal(gate.begin(),null); assert.equal(gate.isCurrent(first),true); gate.invalidate(); assert.equal(gate.isCurrent(first),false); const resumed=gate.begin(); assert.equal(typeof resumed,'number'); gate.finish(resumed); assert.equal(typeof gate.begin(),'number'); gate.dispose(); assert.equal(gate.begin(),null); });
test('question answered supports safe route_data deep-link without question text', () => { assert.match(provider, /question_answered/); assert.match(provider, /route_data/); assert.match(provider, /isSafeQuestionId\(routeData\.questionId\)/); assert.match(provider, /\/questions\/\$\{routeData\.questionId\}/); assert.doesNotMatch(provider, /questionText/); assert.match(panel, /Sorunun cevabı hazır/); });
test('unknown notification types return null or render disabled fallback', () => { assert.match(provider, /return null/); assert.match(panel, /disabled =/); assert.match(panel, /'Bildirim'/); });
test('authentication is required for balance, list, detail and submit', () => { assert.match(ask, /session\?\.access_token/); assert.match(list, /!session\?\.access_token/); assert.match(detail, /!session/); assert.match(apiSource, /Authorization: `Bearer/); });
test('analytics does not collect question text or birth data', () => { const sources = ask + list + detail; assert.doesNotMatch(sources, /analytics|track\(|identify\(/); });
test('bottom navigation is final five-item order with central Ask and no Daily item', () => { const labels = [...tabs.matchAll(/label: '([^']+)'/g)].map((match) => match[1]); assert.deepEqual(labels, ['Ana Sayfa','Haritam','Sor','Keşfet','Profil']); assert.match(tabs, /askItem/); });
test('compact question rows keep an accessible height and readable typography', () => { assert.match(ask, /questionRow:\{[^}]*minHeight:64[^}]*paddingVertical:6/); assert.match(ask, /questionTitle:\{[^}]*fontSize:14[^}]*lineHeight:19/); });
test('long question titles receive flexible width and only truncate after two lines', () => { assert.match(ask, /<Text numberOfLines=\{2\} style=\{styles\.questionTitle\}>/); assert.match(ask, /questionTitle:\{[^}]*flex:1/); assert.match(ask, /questionAction:\{[^}]*flexShrink:0[^}]*gap:0/); });
test('price and chevron stay in a compact trailing action', () => { assert.match(ask, /<View style=\{styles\.questionAction\}><Text style=\{styles\.cost\}>\{item\.starCost\} ✦<\/Text><Ionicons[^>]+chevron-forward[^>]+size=\{18\}/); assert.match(ask, /cost:\{[^}]*fontSize:13/); assert.match(ask, /questionRow:\{[^}]*gap:4[^}]*paddingHorizontal:8/); });
test('questions list exposes queued processing and answered while excluding failed', () => { assert.equal(domain.isVisibleQuestionStatus('queued'),true); assert.equal(domain.isVisibleQuestionStatus('processing'),true); assert.equal(domain.isVisibleQuestionStatus('answered'),true); assert.equal(domain.isVisibleQuestionStatus('failed'),false); assert.match(list, /visibleItems\.map/); });
test('only-failed questions render the normal empty state and detail still supports failed', () => { assert.match(list, /!visibleItems\.length/); assert.match(list, /Henüz takip ettiğin bir sorun yok/); assert.match(detail, /item\.status==='failed'/); });
test('accessible controls expose labels, roles, disabled and busy states', () => { assert.match(ask, /accessibilityLabel/); assert.match(ask, /accessibilityRole="button"/); assert.match(ask, /accessibilityState=\{\{ busy: submitting, disabled: submitting \}\}/); });
test('production submit flag is never defined or enabled in mobile Phase 3 files', () => { const sources = domainSource + apiSource + ask + list + detail; assert.doesNotMatch(sources, /QUESTIONS_SUBMIT_ENABLED|questionsSubmitEnabled/); });
