import type { DailyTransit } from './api/daily-transits';

const PLANETS: Record<string, string> = {
  Sun: 'Güneş', Moon: 'Ay', Mercury: 'Merkür', Venus: 'Venüs', Mars: 'Mars', Jupiter: 'Jüpiter', Saturn: 'Satürn', Uranus: 'Uranüs', Neptune: 'Neptün', Pluto: 'Plüton',
  Ascendant: 'Yükselen', 'North Node': 'Kuzey Ay Düğümü', 'South Node': 'Güney Ay Düğümü',
};
const ASPECTS = {
  conjunction: { label: 'güçlü birleşim', tone: 'neutral' },
  sextile: { label: 'destekleyici açı', tone: 'supportive' },
  trine: { label: 'güçlü uyum', tone: 'supportive' },
  square: { label: 'zorlayıcı açı', tone: 'challenging' },
  opposition: { label: 'gerilimli karşıtlık', tone: 'challenging' },
} as const;

export type TransitTone = 'supportive' | 'challenging' | 'neutral';
type ParsedTransit = { from: string; to: string; aspect: keyof typeof ASPECTS };
export type PresentedTransit = DailyTransit & { tone: TransitTone; category: string };

export function presentTransit(transit: DailyTransit): PresentedTransit {
  const parsed = parseTransitTitle(transit.title);
  if (!parsed) return { ...transit, title: translateTerms(transit.title), text: translateTerms(transit.text), tone: 'neutral', category: `area:${transit.area}` };
  const presentation = themeFor(parsed, transit.area);
  const aspect = ASPECTS[parsed.aspect];
  return {
    area: presentation.area,
    category: presentation.category,
    title: `${planetName(parsed.from)} ile ${planetName(parsed.to)} arasında ${aspect.label}`,
    text: interpretationFor(parsed, aspect.tone, presentation.area),
    tone: aspect.tone,
  };
}

export function dominantTransitTheme(transits: PresentedTransit[]) {
  if (transits.length === 0) return '';
  const counts = new Map<string, number>();
  transits.forEach((item) => counts.set(item.category, (counts.get(item.category) ?? 0) + 1));
  const category = transits.reduce((best, item) => (counts.get(item.category) ?? 0) > (counts.get(best) ?? 0) ? item.category : best, transits[0].category);
  return transits.find((item) => item.category === category)?.area ?? transits[0].area;
}

function parseTransitTitle(title: string): ParsedTransit | null {
  const match = /^(.+?)\s+(conjunction|sextile|trine|square|opposition)\s+(.+)$/i.exec(title.trim());
  if (!match) return null;
  return { from: canonicalPlanet(match[1]), aspect: match[2].toLocaleLowerCase('en-US') as keyof typeof ASPECTS, to: canonicalPlanet(match[3]) };
}

function themeFor({ from, to }: ParsedTransit, fallback: string) {
  const pair = new Set([from, to]);
  if (pair.has('Sun') && pair.has('Moon')) return { area: 'Duygusal denge ve kendini ifade', category: 'emotional' };
  if (pair.has('Sun') && pair.has('Venus')) return { area: 'İlişkiler ve sosyal hayat', category: 'relationship' };
  if (pair.has('Moon') && pair.has('Saturn')) return { area: 'Duygusal sorumluluk ve sınırlar', category: 'emotional' };
  if (pair.has('Mercury')) return { area: 'İletişim ve kararlar', category: 'communication' };
  if (pair.has('Mars')) return { area: 'Enerji, hareket ve mücadele', category: 'action' };
  if (pair.has('Jupiter')) return { area: 'Gelişim ve fırsatlar', category: 'growth' };
  if (pair.has('Saturn')) return { area: 'Sorumluluk, sınırlar ve yapı', category: 'structure' };
  if (pair.has('Venus')) return { area: 'İlişkiler, değerler ve yakınlık', category: 'relationship' };
  if (pair.has('Moon')) return { area: 'Duygular ve iç güven', category: 'emotional' };
  if (pair.has('Sun')) return { area: 'Kendini ifade ve amaçlar', category: 'identity' };
  return { area: fallback, category: `area:${fallback}` };
}

function interpretationFor(parsed: ParsedTransit, tone: TransitTone, area: string) {
  const pair = new Set([parsed.from, parsed.to]);
  const toneText = tone === 'supportive'
    ? 'Aradaki akış, zorlamadan ilerlemeyi ve elindeki imkânları daha rahat fark etmeyi destekliyor.'
    : tone === 'challenging'
      ? 'Aradaki gerilim tepkiyi hızlandırabilir; duyguyu bastırmadan sınırlarını sakin biçimde koruman daha dengeli sonuç verir.'
      : 'İki tema bugün belirgin biçimde buluşuyor; yoğunluğu bilinçli yönetmek hangi ihtiyacın öne çıktığını anlamanı kolaylaştırır.';

  if (pair.has('Sun') && pair.has('Moon')) return `Bugün duygularınla kendini ortaya koyma biçimin daha görünür çalışıyor. İçinden gelenle dışarıya gösterdiğin tavır arasındaki denge, kararlarına ve yakın ilişkilerine doğrudan yansıyabilir. ${toneText} Hislerini açık ama ölçülü ifade etmek, hem kendini anlaşılır kılmana hem de günün akışını daha rahat yönetmene yardımcı olabilir.`;
  if (pair.has('Sun') && pair.has('Venus')) return `Bugün yakınlık kurma, değer görme ve sıcak iletişim isteğin öne çıkıyor. İnsanlarla temasında daha uyumlu bir dil bulabilir; estetik, sosyal planlar veya ilişkilerle ilgili seçimlerde ne istediğini daha net hissedebilirsin. ${toneText} Sırf huzuru korumak için kendi beklentilerini geri plana atmadan karşılıklı alan açman günü verimli kılar.`;
  if (pair.has('Moon') && pair.has('Saturn')) return `Bugün duygusal ihtiyaçlarınla sorumlulukların aynı anda ağırlık kazanabilir. Kendini mesafeli hissetmen ya da her şeyi tek başına taşıman gerektiğini düşünmen mümkün. ${toneText} Dinlenme ihtiyacını küçümsemeden önceliklerini sadeleştirmek ve yapabileceklerine gerçekçi sınırlar koymak, iç baskıyı azaltıp güven duygunu yeniden kurmana yardımcı olabilir.`;

  const subject = area.toLocaleLowerCase('tr-TR');
  if (pair.has('Mercury')) return `Bugün ${subject} konusunda konuşmalar, haberler ve zihinsel kararlar daha belirgin hale gelebilir. Söylediklerin kadar karşındakini nasıl dinlediğin de sonucu etkiliyor. ${toneText} Hızlı varsayımlar yerine sorunu açıkça adlandırmak, eksik bilgiyi tamamlamak ve önemli kararları net cümlelerle ifade etmek iletişimde gereksiz karışıklığı azaltabilir.`;
  if (pair.has('Mars')) return `Bugün ${subject} alanında harekete geçme isteğin ve tepki hızın artabilir. Bir işi başlatmak, sınır koymak veya bekleyen bir konuyu ilerletmek için güçlü bir itki hissedebilirsin. ${toneText} Enerjini tek bir somut hedefe yöneltmek, aceleyle birden fazla cephe açmaktan daha kalıcı bir ilerleme sağlayabilir.`;
  if (pair.has('Jupiter')) return `Bugün ${subject} alanında daha geniş düşünmek ve yeni bir ihtimali değerlendirmek kolaylaşabilir. Fırsatları görmek kadar neyi gerçekten büyütmek istediğini seçmek de önem taşıyor. ${toneText} İyimserliği gerçekçi bir planla birleştirmek, gereğinden fazla söz vermeden hareket etmek ve önündeki seçeneği ölçülü biçimde değerlendirmek yararlı olabilir.`;
  if (pair.has('Saturn')) return `Bugün ${subject} alanında sorumluluklar, sınırlar ve tamamlanması gereken işler daha fazla dikkat isteyebilir. Geciken bir konu sabırla yeniden ele alındığında daha sağlam bir düzene kavuşabilir. ${toneText} Kendine karşı sertleşmek yerine işi küçük adımlara bölmek, gerçekçi bir sınır çizmek ve sürdürülebilir olana yönelmek günün yükünü hafifletebilir.`;
  return `Bugün ${subject} alanı, ${planetName(parsed.from)} ve ${planetName(parsed.to)} temalarının birlikte çalışmasıyla öne çıkıyor. ${toneText} İlk tepkinin ardından durup asıl ihtiyacını fark etmek, koşulları daha doğru değerlendirmeni sağlayabilir. Günün enerjisini tek bir kesin sonuca zorlamak yerine, davranışlarını bilinçli seçmek ve gelişmeleri adım adım izlemek daha yararlı olabilir.`;
}

function canonicalPlanet(value: string) {
  const normalized = value.trim().toLocaleLowerCase('en-US');
  return Object.keys(PLANETS).find((key) => key.toLocaleLowerCase('en-US') === normalized) ?? value.trim();
}
function planetName(value: string) { return PLANETS[value] ?? value; }
function translateTerms(value: string) {
  const aspectTerms = Object.entries(ASPECTS).map(([id, item]) => [id, item.label] as const);
  return [...Object.entries(PLANETS), ...aspectTerms].reduce((text, [source, target]) => text.replaceAll(source, target).replaceAll(source.toLocaleLowerCase('en-US'), target), value);
}

export function formatTransitDate(date?: string) {
  const parsed = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T12:00:00+03:00`) : new Date();
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long', timeZone: 'Europe/Istanbul' }).format(parsed);
}
