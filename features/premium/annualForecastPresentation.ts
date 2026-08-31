import type { AnnualForecast, ForecastMonth, ForecastQuestion } from '@/features/astrology/api/annual-forecast';

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const banned = /Bu temas, koşullarını|farkındalık alanı|olasılık ve zamanlama iklimi|kesin olay veya finansal sonucu garanti etmez|gerçek transitlerin daha görünür olduğu bir ay/gi;

function words(value: string) { return value.trim().split(/\s+/).length; }
function clean(value: string | null | undefined) { return (value ?? '').replace(banned, '').replace(/\s{2,}/g, ' ').trim(); }
function corpus(month: ForecastMonth) { return [month.mainTheme, ...month.sections.map((item) => `${item.title} ${item.text}`), month.opportunity, month.attention, ...month.importantDates.map((item) => item.title)].join(' ').toLocaleLowerCase('tr-TR'); }
function score(month: ForecastMonth, keys: string[]) { const text = corpus(month); return keys.reduce((total, key) => total + (text.includes(key) ? 1 : 0), 0); }
function ranked(months: ForecastMonth[], keys: string[]) { return [...months].sort((a, b) => score(b, keys) - score(a, keys) || b.importantDates.length - a.importantDates.length); }
function period(month: ForecastMonth | undefined) { return month?.label ?? 'Önümüzdeki 12 ay'; }
function pair(first: ForecastMonth | undefined, second: ForecastMonth | undefined) { return second && second.id !== first?.id ? `${period(first)} ile ${period(second)}` : period(first); }
function dateLabel(date: string) { const value = new Date(`${date}T12:00:00Z`); return `${value.getUTCDate()} ${MONTHS[value.getUTCMonth()]}`; }

type LifeTheme = 'love' | 'career' | 'money' | 'home' | 'education' | 'growth';
const themeCopy: Record<LifeTheme, { label: string; opportunity: string; attention: string; date: string }> = {
  love: { label: 'İlişkiler ve Sosyal Hayat', opportunity: 'Tanışma, açık bir görüşme veya sosyal bir temas için daha rahat adım atabilirsin.', attention: 'Yakınlık artarken beklentiyi hızla büyütmeden karşındaki kişinin davranışlarını gözlemle.', date: 'İlişkiler ve sosyal temaslarda dikkat çeken dönem' },
  career: { label: 'Kariyer ve İş', opportunity: 'Başvuru, proje görüşmesi veya yeni bir sorumluluk için hazırladığın adımı ilerletebilirsin.', attention: 'Görünürlük artarken aynı anda gereğinden fazla sorumluluk almamaya dikkat et.', date: 'Kariyer ve sorumluluklarda dikkat çeken dönem' },
  money: { label: 'Para ve Maddi Düzen', opportunity: 'Ücret, tahsilat, bütçe veya gelir artıran bir planı somutlaştırabilirsin.', attention: 'Fırsat büyürken harcama ve yükümlülükleri de aynı hızla artırmamaya dikkat et.', date: 'Para ve maddi düzen açısından dikkat çeken dönem' },
  home: { label: 'Ev ve Aile', opportunity: 'Ev düzeni, aile görüşmesi veya yerleşim planında bekleyen bir adımı netleştirebilirsin.', attention: 'Herkesin ihtiyacını üstlenmeden önce kendi sınırını ve bütçeni koru.', date: 'Ev, aile ve yaşam düzeninde dikkat çeken dönem' },
  education: { label: 'Eğitim ve Yurtdışı', opportunity: 'Eğitim, başvuru, uzak bağlantı veya yolculuk planında ilerleme sağlayabilirsin.', attention: 'Belge, takvim ve bütçe ayrıntılarını son ana bırakmamaya dikkat et.', date: 'Eğitim ve uzak bağlantılarda dikkat çeken dönem' },
  growth: { label: 'Kişisel Gelişim', opportunity: 'Kendin için ertelediğin bir kararı netleştirip küçük ama kalıcı bir adım atabilirsin.', attention: 'Hızlı sonuç beklemek yerine enerjini tek bir öncelikte toplamaya dikkat et.', date: 'Kişisel kararlar ve gelişim açısından dikkat çeken dönem' },
};

function dominantTheme(month: ForecastMonth): LifeTheme {
  const primary = `${month.sections[0]?.title ?? ''} ${month.mainTheme}`.toLocaleLowerCase('tr-TR');
  if (/aşk|ilişki|sosyal/.test(primary)) return 'love';
  if (/kariyer|meslek|& iş|^iş/.test(primary)) return 'career';
  if (/para|maddi|gelir|finans/.test(primary)) return 'money';
  if (/ev|aile|yerleşim|ic/.test(primary)) return 'home';
  if (/eğitim|yurtdışı|uzak|seyahat/.test(primary)) return 'education';
  if (/kişisel gelişim|değişim|baskı/.test(primary)) return 'growth';
  const text = corpus(month);
  const candidates: Array<[LifeTheme, string[]]> = [['love', ['aşk', 'ilişki', 'venüs']], ['career', ['kariyer', 'iş', 'mc']], ['money', ['para', 'maddi', 'gelir']], ['home', ['ev & aile', 'ic', 'yerleşim']], ['education', ['eğitim', 'yurtdışı', 'seyahat']]];
  const best = candidates.map(([id, keys]) => ({ id, value: keys.reduce((sum, key) => sum + (text.includes(key) ? 1 : 0), 0) })).sort((a, b) => b.value - a.value)[0];
  return best?.value ? best.id : 'growth';
}

function themeReason(month: ForecastMonth) {
  const theme = dominantTheme(month);
  return `${themeCopy[theme].label} — ${themeCopy[theme].opportunity.replace(/\.$/, '')}`;
}

function saturnEvidence(...months: Array<ForecastMonth | undefined>) {
  const raw = months.flatMap((month) => month ? [...month.importantDates.map((item) => item.title), month.opportunity, month.attention, ...month.sections.map((item) => item.text)] : []).filter((item): item is string => Boolean(item)).filter((item) => /satürn|saturn/i.test(item));
  return [...new Set(raw.map((item) => {
    if (/mc|kariyer|güneş|sun/i.test(item)) return 'Satürn’ün kariyer ve sorumluluk alanını yoğunlaştırması';
    if (/ay|moon|ic|ev/i.test(item)) return 'Satürn’ün duygusal güven ve yaşam düzenini yapılandırması';
    if (/venüs|venus|7\. ev|ilişki/i.test(item)) return 'Satürn’ün ilişkilerde sınır ve sorumluluğu belirginleştirmesi';
    return 'Satürn’ün kişisel sınırlarını ve sorumluluklarını yeniden yapılandırması';
  }))].slice(0, 3);
}

function transitLabel(raw: string) {
  const value = clean(raw)
    .replace(/\bconjunction\b/gi, 'ile güçlü birleşim')
    .replace(/\bsextile\b/gi, 'ile destekleyici açı')
    .replace(/\btrine\b/gi, 'ile güçlü uyum')
    .replace(/\bsquare\b/gi, 'ile zorlayıcı açı')
    .replace(/\bopposition\b/gi, 'ile karşıtlık')
    .replace(/\bJupiter\b/g, 'Jüpiter').replace(/\bSaturn\b/g, 'Satürn').replace(/\bVenus\b/g, 'Venüs')
    .replace(/\bMoon\b/g, 'Ay').replace(/\bSun\b/g, 'Güneş').replace(/\bAscendant\b/g, 'Yükselen');
  if (/jüpiter/i.test(value) && /mc|kariyer/i.test(value)) return 'Jüpiter’in kariyer alanını desteklemesi';
  if (/satürn/i.test(value) && /mc|güneş|yükselen/i.test(value)) return 'Satürn’ün sorumluluk ve yön duygunu yapılandırması';
  if (/venüs|ay|mars/i.test(value)) return 'İlişki ve duygusal yakınlık göstergelerinin hareketlenmesi';
  if (/uranüs/i.test(value)) return 'Uranüs’ün değişim ihtiyacını güçlendirmesi';
  if (/jüpiter/i.test(value)) return 'Jüpiter’in büyüme ve fırsat alanını desteklemesi';
  if (/satürn/i.test(value)) return 'Satürn’ün düzen ve sorumluluk ihtiyacını artırması';
  return value.replace(/\s*[—-]\s*\d+[.,]\d+°?$/, '');
}

function evidence(...months: Array<ForecastMonth | undefined>) {
  return [...new Set(months.flatMap((month) => month?.importantDates.map((item) => transitLabel(item.title)) ?? []).filter(Boolean))].slice(0, 3);
}

function question(id: number, title: string, answer: string, focus: string | null, indicators: string[]): ForecastQuestion {
  return { id: `annual-question-${id}`, title, answer: clean(answer), period: focus, indicators };
}

export function createAnnualQuestionPresentation(forecast: AnnualForecast): ForecastQuestion[] {
  const love = ranked(forecast.months, ['aşk', 'ilişki', 'venüs', 'ay', 'mars']);
  const career = ranked(forecast.months, ['kariyer', 'iş', 'mc', 'satürn', 'güneş']);
  const money = ranked(forecast.months, ['para', 'maddi', 'jüpiter', 'venüs', 'satürn']);
  const home = ranked(forecast.months, ['ev & aile', 'ic', 'ay', 'yerleşim']);
  const change = ranked(forecast.months, ['değişim', 'baskı', 'uranüs', 'plüton', 'satürn']);
  const supportive = [...forecast.months].sort((a, b) => Number(Boolean(b.opportunity)) - Number(Boolean(a.opportunity)) || b.importantDates.length - a.importantDates.length);
  const difficult = [...forecast.months].sort((a, b) => Number(Boolean(b.attention)) - Number(Boolean(a.attention)) || b.importantDates.length - a.importantDates.length);
  const saturn = ranked(forecast.months, ['satürn']);
  const eclipse = ranked(forecast.months, ['tutulma', 'eclipse']);
  const lucky = supportive.filter((item, index, all) => item.opportunity && all.findIndex((other) => dominantTheme(other) === dominantTheme(item)) === index).slice(0, 3);
  const careful = difficult.filter((item) => item.attention).slice(0, 3);
  const luckyList = lucky.map((item, index) => `${index + 1}. ${item.label}: ${themeReason(item)}`).join(' ');
  const carefulList = careful.map((item) => `${item.label}: ${transitLabel(item.importantDates[0]?.title ?? item.attention ?? 'temponu düzenleme')}`).join(' ');
  const hasEclipse = eclipse.some((item) => /tutulma|eclipse/i.test(corpus(item)));

  return [
    question(1, 'Bu yıl hayatıma biri girer mi?', `Yeni bir tanışma açısından en açık penceren ${pair(love[0], love[1])} çevresinde görünüyor. İlişki göstergelerinin hareketlenmesi, sosyal hayata daha kolay karışabileceğin ve birine karşı merakının hızla artabileceği bir dönem yaratıyor. Yalnızca ilk çekime değil, karşındaki kişinin tutarlılığına ve duygusal olarak ulaşılabilir olup olmadığına bakman önemli. Özellikle arkadaş çevresi, ortak bir uğraş veya iş bağlantısı beklenmedik bir tanışmaya aracılık edebilir. Bu aylarda davetleri, ortak çevreleri ve yeni iletişim fırsatlarını değerlendirdiğinde tanışma ihtimalini güçlendirebilirsin; ilişkinin yönünü ise iki tarafın gerçek davranışları belirler.`, pair(love[0], love[1]), evidence(love[0], love[1])),
    question(2, 'Evlenme zamanı var mı?', `İlişkiyi ciddileştirme ve ortak gelecek konuşmaları açısından ${pair(love[0], saturn[0])} daha güçlü görünüyor. Yakınlık isteğinin yanında sorumluluk, güven ve birlikte düzen kurma konusu öne çıkıyor. Devam eden bir ilişkin varsa bu dönem niyetleri netleştirmek, aile ve yaşam düzeni hakkında somut konuşmak için kullanılabilir. Yeni bir ilişkide ise hızlı karar vermek yerine davranışların sürekliliğini gözlemlemen daha sağlıklı olur. Harita evlilik kararı vermiyor; fakat sağlam bir bağı resmileştirmek için hangi aylarda daha ciddi bir zemin oluşabileceğini gösteriyor.`, pair(love[0], saturn[0]), evidence(love[0], saturn[0])),
    question(3, 'Eski sevgili geri döner mi?', `${period(love[1])} çevresinde geçmiş bir ilişkiyi yeniden düşünme, yarım kalan bir konuşmayı tamamlama veya eski bağlarla ilgili haber alma ihtimalin artabilir. Bu hareketlilik belirli bir kişinin mutlaka döneceği anlamına gelmiyor; asıl vurgu, eski ilişkinin sende bıraktığı ihtiyacı daha net görmende. Sessizlik bozulsa bile hemen eski düzene dönmek zorunda değilsin. İletişim kurulursa yalnız özleme değil, ayrılığa yol açan koşulların gerçekten değişip değişmediğine bak. Aynı davranışlar sürüyorsa geri dönüş kısa süreli kalabilir; açıklık ve sorumluluk varsa daha olgun bir değerlendirme yapılabilir.`, period(love[1]), evidence(love[1], love[2])),
    question(4, 'Ayrılık ya da barış ihtimali?', `${pair(difficult[0], love[0])} ilişki kararları açısından belirleyici olabilir. İlk dönem biriken rahatsızlıkları görünür kılarak mesafe, sabırsızlık veya güç mücadelesi yaratabilir; sonraki destekleyici pencere ise sakin konuşma ve yakınlaşma için daha uygun bir zemin sunuyor. Bir bağın devam edip etmeyeceğini tek bir gökyüzü hareketi değil, iki tarafın sorun karşısındaki tavrı belirler. Tepki vermeden önce ihtiyacını açıkça söylemen, eski tartışmayı tekrarlamak yerine somut çözüm istemen barış ihtimalini güçlendirir; sürekli sınır ihlalinde ise mesafe daha koruyucu olabilir.`, pair(difficult[0], love[0]), evidence(difficult[0], love[0])),
    question(5, 'İş değişimi olur mu?', `İş değişikliği açısından en hareketli pencere ${pair(career[0], change[0])} çevresinde açılıyor. Mesleki yönünü, günlük çalışma düzenini veya üstlendiğin sorumlulukları yeniden ele alma isteğin güçlenebilir. Bu dönem yalnızca mevcut işten sıkılmayı değil, daha fazla yetki ve gelişim alanı aradığını gösteriyor. Başvuru, görüşme ve görev değişikliği konuşmalarını bu aylara hazırlamak verimli olur. Alternatiflerini yazılı biçimde karşılaştırman kararını netleştirir. Ani bir kopuş yerine önce seçenekleri, ücret koşullarını ve iş yükünü karşılaştırman; değişimi geçici baskıdan değil uzun vadeli hedefinden hareketle yapman daha sağlam sonuç verir.`, pair(career[0], change[0]), evidence(career[0], change[0])),
    question(6, 'Terfi alır mıyım?', `Terfi ve görünür sorumluluk açısından ${period(career[0])} yılın en güçlü dönemi. Emeğinin fark edilmesi kadar senden daha fazla düzen, karar alma ve sonuç takibi beklenebilir. Bu nedenle yalnızca iş yükünün artmasını gerçek bir ilerleme sanmaman önemli; unvan, ücret ve yetki karşılığını açıkça konuş. Yöneticine tamamladığın işleri ölçülebilir sonuçlarla göstermek, yeni sorumluluğun sınırlarını belirlemek ve talebini zamanında dile getirmek fırsatı büyütür. Önceden hazırlayacağın kısa bir başarı dökümü görüşmede elini güçlendirebilir. Gökyüzü görünürlüğünü destekliyor; kurumdaki karar süreci ve hazırlığın sonucun biçimini belirleyecek.`, period(career[0]), evidence(career[0], career[1])),
    question(7, 'İş kurmak için uygun dönem?', `İş kurma fikrini somutlaştırmak için ${period(career[1])}, başlangıç veya görünür adım içinse ${period(supportive[0])} daha elverişli görünüyor. İlk dönemi bütçe, müşteri ihtiyacı, sözleşmeler ve iş modelini sınamak için kullanman riskini azaltır. İkinci pencere tanıtım, görüşme ve ilk satış gibi dışarı açılan adımları destekleyebilir. Güvendiğin bir uzmandan mali ve hukuki görüş almak eksiklerini erkenden gösterir. Aynı anda büyük borç ve yüksek sabit gider üstlenmek yerine küçük ölçekte doğrulama yapman daha doğru olur. Hareket isteğin güçlü olsa da sürdürülebilirlik, heyecandan önce sistem kurmana bağlı.`, pair(career[1], supportive[0]), evidence(career[1], supportive[0])),
    question(8, 'Yurtdışı fırsatı var mı?', `Yurtdışıyla bağlantılı eğitim, iş görüşmesi veya seyahat açısından ${pair(change[0], supportive[1])} dikkat çekiyor. Bu dönem mevcut düzeninin dışına çıkma isteğini artırabilir ve uzak bağlantılardan haber getirebilir. Haritandaki vurgu yalnız taşınmayı değil, yabancı dil, uluslararası ekip, uzaktan çalışma ya da eğitim yoluyla ufkunu genişletmeyi de kapsıyor. Özgeçmişini ve gerekli belgeleri erkenden hazırlaman zaman baskısını azaltır. Başvuru ve resmi işlemleri son ana bırakmaman, bütçe ve vize koşullarını önceden netleştirmen önemli. Fırsat kapısı açıldığında hazırlıklı olman, bu hareketliliği kalıcı bir seçeneğe dönüştürebilir.`, pair(change[0], supportive[1]), evidence(change[0], supportive[1])),
    question(9, 'Maddi rahatlama ne zaman?', `Gelir akışını rahatlatmak açısından en destekleyici dönem ${period(money[0])} çevresinde görünüyor. Bu ay yalnız beklenmedik para değil; yaptığın işin karşılığını büyütme, yeni gelir konuşması açma veya bütçedeki baskıyı azaltacak bir düzen kurma fırsatı getiriyor. Kazanç ihtimalini güçlendirmek için ücret pazarlığı, ek proje ve tahsilat gibi somut adımları öne almalısın. Küçük fakat düzenli artışları da küçümsememen önemli. Rahatlamayı tek seferlik harcamayla tüketmek yerine borç azaltma ve birikim planına bağlaman etkisini kalıcılaştırır. Fırsat artıyor; sonucu hazırlığın ve gerçek mali koşullar belirler.`, period(money[0]), evidence(money[0], money[1])),
    question(10, 'Borç kapanır mı?', `Borç yükünü azaltma veya ödeme planını yeniden yapılandırma açısından ${pair(money[0], saturn[0])} daha kullanışlı bir dönem sunuyor. Harita bir borcun kendiliğinden kapanacağını söylemiyor; gelir-gider dengesini sıkılaştırabileceğin ve sürdürülebilir ödeme düzeni kurabileceğin zamanı gösteriyor. Faiz, vade ve ortak yükümlülükleri yazılı olarak karşılaştırman; varsa ek geliri önce ana borca yönlendirmen rahatlama sağlayabilir. Düzenli takip burada hızdan daha değerlidir. Yeni bir borçla eski yükü kapatmadan önce toplam maliyeti görmen önemli. Disiplinli ilerlersen bu pencere yükün belirgin biçimde hafiflemesine yardım edebilir.`, pair(money[0], saturn[0]), evidence(money[0], saturn[0])),
    question(11, 'Büyük para girişi var mı?', `${period(money[0])} para hareketi açısından yılın en güçlü penceresi olsa da harita tek başına büyük ve ani bir kazanç vaat etmiyor. Daha gerçekçi olasılık; iş, proje, prim, tahsilat veya kaynak paylaşımı üzerinden tutarı büyüyebilecek bir fırsatın belirginleşmesi. Bu dönemde gelen teklifi yalnız rakamla değil, vergi, borç, ortaklık payı ve devamlılık açısından incelemen gerekir. Yazılı koşullar sözlü heyecandan daha güvenilir olacaktır. Güçlü bir göstergeyi plansız risk almak için kullanma. Büyük para ihtimali, hazırladığın değer ve yaptığın anlaşmanın niteliğiyle birlikte anlam kazanır.`, period(money[0]), evidence(money[0], money[1])),
    question(12, 'Ev alma zamanı?', `Ev satın alma kararını değerlendirmek için ${pair(home[0], money[1])} öne çıkıyor. İlk dönem yaşam alanını değiştirme isteğini ve aile düzeniyle ilgili ihtiyaçları belirginleştirirken, ikinci dönem finansman tarafını daha gerçekçi görmene yardım edebilir. Bu vurgu yalnız taşınma anlamına gelebileceği için satın alma kararını aceleye getirme; peşinat, kredi maliyeti ve uzun vadeli ödeme gücünü birlikte incele. Uygun ev arama ve bütçe hazırlığını bu aylarda yapabilirsin. İmza için gökyüzünden çok hukuki kontrol ve sürdürülebilir bütçe belirleyici olmalı.`, pair(home[0], money[1]), evidence(home[0], money[1])),
    question(13, 'Şehir değişikliği olur mu?', `Şehir veya yaşam düzeni değişikliği açısından ${pair(home[0], change[0])} daha hareketli görünüyor. Ev, aile, iş ve uzak bağlantılar aynı dönemde gündeme geldiğinde bulunduğun yerde kalmanın gerçek maliyetini yeniden düşünebilirsin. Bu enerji kesin taşınma değil; yeni bir şehir araştırma, geçici konaklama, iş nedeniyle yer değiştirme veya ev düzenini yenileme şeklinde de çalışabilir. Mümkünse düşündüğün yerde kısa bir deneme süresi geçir. Karar vermeden önce gelir sürekliliği, destek ağı ve günlük yaşam koşullarını karşılaştır. Değişim isteğin kalıcıysa bu dönem planı somut adımlara bölmek için güçlü olabilir.`, pair(home[0], change[0]), evidence(home[0], change[0])),
    question(14, 'Şanslı aylar', `Önündeki dönemde fırsatların daha rahat ilerleyebileceği aylar şunlar: ${luckyList || `${period(supportive[0])}: ${themeReason(supportive[0])}`}. Her dönemi kendi ana konusu içinde değerlendirmen önemli. İlişki vurgusu olan ayda sosyal temaslara ve açık iletişime, kariyer vurgusunda görüşme ve projelere, maddi vurgu olduğunda ise gelir ve bütçe kararlarına öncelik verebilirsin. Şansı pasif bir tesadüf gibi beklemek yerine o ayın desteklediği yaşam alanında hazırladığın somut adımı atman, fırsatın sana ulaşmasını ve daha kalıcı bir karşılık bulmasını kolaylaştırır.`, lucky.map((item) => item.label).join(', ') || period(supportive[0]), lucky.map(themeReason)),
    question(15, 'Dikkat edilmesi gereken dönemler', `Temponu ve kararlarını daha bilinçli yönetmen gereken dönemler: ${carefulList || period(difficult[0])}. Bu aylarda acele karar, gereğinden fazla iş yükü, ilişkide sert tepki veya bütçeyi zorlayan bir adım daha yorucu sonuç verebilir. Gökyüzü korkulacak bir olay söylemiyor; hangi konuda frene basman gerektiğini gösteriyor. Önemli konuşmaları hazırlıksız yapmamak, sözleşme ve harcamaları iki kez kontrol etmek, dinlenme alanını korumak baskıyı azaltır. Zorlayıcı dönemi doğru kullandığında hatayı erken görüp daha sağlam bir düzen kurabilirsin.`, careful.map((item) => item.label).join(', ') || period(difficult[0]), evidence(...careful)),
    question(16, 'Tutulma etkileri', hasEclipse ? `${period(eclipse[0])} çevresindeki tutulma, kişisel göstergelerine anlamlı biçimde temas ettiği için yaşam yönün, ilişkilerin veya ev-kariyer dengende görünür bir değişim başlatabilir. Etki tek bir günde olup bitmekten çok, öncesi ve sonrasındaki haftalarda netleşen kararlarla çalışır. Gelen gelişmeyi hemen sonuçlandırmak yerine hangi düzenin artık sürdürülemediğini gözlemle. Tutulma sana zorunlu bir kader yazmaz; fakat uzun süredir ertelenen bir konuyu görünür kılarak yeni bir yön seçmeni hızlandırabilir.` : `Bu 12 aylık kişisel taramada, doğum haritandaki Güneş, Ay ve ana eksenlere bağlanan ayrı ve doğrulanmış bir tutulma penceresi bulunmuyor. Bu nedenle sana rastgele tutulma tarihi veya büyük bir olay anlatılmıyor. Yıl içindeki değişim başlıkların yine gerçek gezegen temasları üzerinden izlenmeye devam ediyor. Genel tutulma haberlerini kendi hayatında kesin bir gelişme gibi yorumlamak yerine, yalnız kişisel haritana yakın bir temas oluştuğunda dikkate almak daha doğru. Bu dönem için asıl güçlü vurgu ${period(change[0])} çevresindeki değişim ihtiyacında.`, hasEclipse ? period(eclipse[0]) : period(change[0]), hasEclipse ? evidence(eclipse[0]) : evidence(change[0])),
    question(17, 'Satürn sınavı', `Satürn’ün senden istediği temel şey, ${/kariyer|mc|güneş/i.test(corpus(saturn[0])) ? 'kariyerinde sorumluluk ile gerçek karşılığı ayırman ve kalıcı bir yön kurman' : /ay|ev|ic/i.test(corpus(saturn[0])) ? 'ev ve duygusal güven alanında sınırlarını daha sağlam kurman' : 'yüklerini sadeleştirip sürdürülebilir bir düzen oluşturman'}. Bu konu ${period(saturn[0])} çevresinde yoğunlaşıyor. Gecikme veya artan sorumluluk ilk anda baskı yaratabilir; fakat senden mükemmellik değil, plan, sınır ve devamlılık bekleniyor. Başkalarının yükünü otomatik olarak üstlenmek yerine görev paylaşımını açıkça konuşman gerekiyor. Üstlendiğin işi parçalara ayırman, yapamayacağın sözü vermemen ve emek verdiğin alanın karşılığını sorgulaman önemli. Doğru yönetildiğinde bu dönem sana dayanıklılık, yetkinlik ve daha güvenilir bir yapı kazandırabilir.`, period(saturn[0]), saturnEvidence(saturn[0], saturn[1])),
  ];
}

export function createMonthlyForecastPresentation(forecast: AnnualForecast): ForecastMonth[] {
  return forecast.months.map((month) => {
    const theme = dominantTheme(month);
    const copy = themeCopy[theme];
    const opportunitySignal = transitLabel(month.importantDates.find((item) => clean(month.opportunity).includes(item.title))?.title ?? month.importantDates[0]?.title ?? month.opportunity ?? copy.label);
    const attentionSignal = transitLabel(month.importantDates.find((item) => clean(month.attention).includes(item.title))?.title ?? month.attention ?? copy.label);
    const supportiveAttention = /jüpiter|destekleyici|güçlü uyum/i.test(attentionSignal);
    const text = `${month.label} boyunca ${copy.label.toLocaleLowerCase('tr-TR')} günlük kararlarında daha fazla yer tutabilir. ${copy.opportunity} Ayın hızına kapılmadan önceliklerini netleştirmen önemli; her seçeneğe aynı anda yönelmek yerine en somut karşılığı olan adımı seç. ${supportiveAttention ? 'Fırsatlar çoğalırken kapasiteni aşan sözler vermemek ve enerjini bölmemek dengeyi korur.' : copy.attention} Öne çıkan tarih, ayın ana konusunu somut bir karar veya görüşmeyle ilerletmene yardımcı olabilir.`;
    const importantDates = month.importantDates.map((item) => ({ ...item, title: `${copy.date} · ${transitLabel(item.title)}` }));
    return { ...month, mainTheme: `Ana Tema: ${copy.label}`, sections: [{ id: 'overview', title: 'Ayın Yorumu', text: clean(text) }], opportunity: copy.opportunity, attention: supportiveAttention ? `Fırsatlar artarken aynı anda çok fazla sorumluluk alma. ${copy.attention}` : copy.attention, importantDates };
  });
}

export function annualQuestionWordCount(item: ForecastQuestion) { return words(item.answer); }
export function monthlyWordCount(item: ForecastMonth) { return words(item.sections.map((section) => section.text).join(' ')); }
