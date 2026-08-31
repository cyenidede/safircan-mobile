import type { AnnualForecast, ForecastMonth } from '@/features/astrology/api/annual-forecast';
import type { NatalPlanet, PremiumModule, PremiumNatalResponse, PremiumReportAnalysis, PremiumReportIndicator } from '@/features/astrology/api/types';
import { formatIndicatorAspect, indicatorInterpretation, indicatorWordCount } from '@/features/premium/indicatorPresentation';

// DEVELOPMENT/TEST ONLY. 2000-01-01 12:00, İstanbul chart'ının gerçek backend çıktısıdır.
// Bu dosya entitlement değildir ve hiçbir production API cevabının yerine kullanılmaz.
const planets: NatalPlanet[] = [
  { name: 'Sun', sign: 'Capricorn', degree: 10.284, house: 10, retrograde: false },
  { name: 'Moon', sign: 'Scorpio', degree: 12.3215, house: 7, retrograde: false },
  { name: 'Mercury', sign: 'Capricorn', degree: 1.7596, house: 9, retrograde: false },
  { name: 'Venus', sign: 'Sagittarius', degree: 1.465, house: 8, retrograde: false },
  { name: 'Mars', sign: 'Aquarius', degree: 27.8987, house: 11, retrograde: false },
  { name: 'Jupiter', sign: 'Aries', degree: 25.2497, house: 1, retrograde: false },
  { name: 'Saturn', sign: 'Taurus', degree: 10.3973, house: 1, retrograde: true },
  { name: 'Uranus', sign: 'Aquarius', degree: 14.805, house: 11, retrograde: false },
  { name: 'Neptune', sign: 'Aquarius', degree: 3.19, house: 11, retrograde: false },
  { name: 'Pluto', sign: 'Sagittarius', degree: 11.4518, house: 8, retrograde: false },
  { name: 'North Node', sign: 'Leo', degree: 3.9586, house: 5, retrograde: true },
  { name: 'South Node', sign: 'Aquarius', degree: 3.9586, house: 11, retrograde: true },
  { name: 'Chiron', sign: 'Sagittarius', degree: 11.6082, house: 8, retrograde: false },
  { name: 'Lilith', sign: 'Sagittarius', degree: 23.344, house: 9, retrograde: false },
];

const houses = [
  { id: 1, sign: 'Aries', startDegree: 16.15227, endDegree: 53.01704 }, { id: 2, sign: 'Taurus', startDegree: 53.01704, endDegree: 77.57175 },
  { id: 3, sign: 'Gemini', startDegree: 77.57175, endDegree: 98.56717 }, { id: 4, sign: 'Cancer', startDegree: 98.56717, endDegree: 120.97445 },
  { id: 5, sign: 'Leo', startDegree: 120.97445, endDegree: 150.62079 }, { id: 6, sign: 'Virgo', startDegree: 150.62079, endDegree: 196.15227 },
  { id: 7, sign: 'Libra', startDegree: 196.15227, endDegree: 233.01704 }, { id: 8, sign: 'Scorpio', startDegree: 233.01704, endDegree: 257.57175 },
  { id: 9, sign: 'Sagittarius', startDegree: 257.57175, endDegree: 278.56717 }, { id: 10, sign: 'Capricorn', startDegree: 278.56717, endDegree: 300.97445 },
  { id: 11, sign: 'Aquarius', startDegree: 300.97445, endDegree: 330.62079 }, { id: 12, sign: 'Pisces', startDegree: 330.62079, endDegree: 16.15227 },
];

const aspects = [
  { from: 'Sun', to: 'Moon', type: 'sextile', orb: 2.04 }, { from: 'Sun', to: 'Saturn', type: 'trine', orb: 0.11 },
  { from: 'Moon', to: 'Saturn', type: 'opposition', orb: 1.92 }, { from: 'Moon', to: 'Uranus', type: 'square', orb: 2.48 },
  { from: 'Mars', to: 'Mercury', type: 'sextile', orb: 3.86 }, { from: 'Mars', to: 'Jupiter', type: 'sextile', orb: 2.65 },
  { from: 'Mars', to: 'Venus', type: 'square', orb: 3.57 }, { from: 'Venus', to: 'Neptune', type: 'sextile', orb: 1.72 },
  { from: 'Saturn', to: 'Uranus', type: 'square', orb: 4.41 }, { from: 'Uranus', to: 'Pluto', type: 'sextile', orb: 3.35 },
  { from: 'Chiron', to: 'Pluto', type: 'conjunction', orb: 0.1564 }, { from: 'Chiron', to: 'Uranus', type: 'sextile', orb: 3.1968 },
  { from: 'Lilith', to: 'Jupiter', type: 'trine', orb: 1.9057 }, { from: 'Lilith', to: 'Mars', type: 'sextile', orb: 4.5547 },
  { from: 'Juno', to: 'Sun', type: 'conjunction', orb: 2.3345 },
  { from: 'Vesta', to: 'Venus', type: 'conjunction', orb: 4.4419 }, { from: 'Vesta', to: 'Pluto', type: 'conjunction', orb: 5.5449 },
  { from: 'Pallas', to: 'Uranus', type: 'opposition', orb: 0.7375 }, { from: 'Pallas', to: 'Moon', type: 'square', orb: 1.746 },
];

const module = (id: string, category: PremiumModule['category'], title: string, summary: string, indicators: string[], detail: string): PremiumModule => ({ id, category, title, summary, indicators, detail, available: true });
const modules: PremiumModule[] = [
  module('personality', 'self', 'Gelişmiş Kişilik Analizi', 'Oğlak Güneş, Akrep Ay ve Koç yükselen; hedef, derinlik ve doğrudan hareket etme ihtiyacını birlikte çalıştırıyor.', ['Güneş — Oğlak — 10. Ev', 'Ay — Akrep — 7. Ev', 'Yükselen — Koç'], 'Bu gerçek test haritasında görünür hedefler ile ilişkilerde duygusal derinlik birlikte öne çıkıyor. Koç yükselen ilk adımı hızlandırırken Oğlak vurgusu sonuçları yapılandırmaya yardımcı oluyor.'),
  module('talents', 'self', 'Doğuştan Gelen Yeteneklerin', 'Merkür, Venüs ve Mars yerleşimleri stratejik düşünme, anlam üretme ve ekipler içinde yenilik geliştirme kapasitesini destekliyor.', ['Merkür — Oğlak — 9. Ev', 'Venüs — Yay — 8. Ev', 'Mars — Kova — 11. Ev'], 'Yetenek göstergeleri hazır bir sonuç değil, düzenli kullanımla büyüyen kapasitelerdir. Bu haritada planlama, araştırma ve farklı bakışları ortak hedefte buluşturma temaları belirgin.'),
  module('strengths', 'self', 'Güçlü Tarafların ve Gelişim Alanların', 'Akıcı açılar dayanıklılığı desteklerken kare ve karşıtlıklar tempo ile duygusal ihtiyaç arasında bilinçli denge kurmayı hatırlatıyor.', ['Güneş üçgen Satürn — 0.11°', 'Ay karşıt Satürn — 1.92°', 'Ay kare Uranüs — 2.48°'], 'Güneş–Satürn üçgeni yapı kurmayı kolaylaştırabilir. Ay’ın Satürn ve Uranüs bağlantıları ise yakınlık, sınır ve özgürlük ihtiyaçlarını aynı anda gözetmeyi öğrenme alanı sunar.'),
  module('love', 'love', 'Aşk ve İlişki Haritan', 'Akrep Ay ve Yay Venüs, ilişkilerde hem derin güven hem dürüst ve genişletici paylaşım aradığını gösteriyor.', ['Ay — Akrep — 7. Ev', 'Venüs — Yay — 8. Ev', '7. Ev — Terazi'], 'İlişki potansiyeli kesin bir sonuç vaat etmez. Bu yerleşimler yakınlıkta şeffaflık, karşılıklılık ve duygusal güvenin birlikte önem kazanabileceğini anlatır.'),
  module('marriage', 'love', 'Evlilik Potansiyelin', 'Terazi 7. ev ve yöneticisi Venüs’ün 8. ev yerleşimi, uzun ilişkide adalet ile derin paylaşım temasını birleştiriyor.', ['7. Ev — Terazi', 'Venüs — Yay — 8. Ev', 'Ay — Akrep — 7. Ev'], 'Uzun vadeli ortaklıkta açık konuşmak, ortak kaynakları şeffaf yönetmek ve iki tarafın alanını korumak sürdürülebilirliği destekleyebilir.'),
  module('partner', 'love', 'Hayatına Çektiğin Partner Tipi', 'Terazi Descendant; dengeli, sosyal ve karşılıklılığı önemseyen karakterlerin dikkatini daha kolay çekebileceğini gösteriyor.', ['Descendant — Terazi', '7. evde Ay', 'Venüs — Yay'], 'Bu gösterge tek bir insan tipi dayatmaz. İlişkiler aracılığıyla diplomasi, duygusal açıklık ve ortak karar alma özellikleri daha görünür olabilir.'),
  module('career', 'career', 'Kariyer ve Başarı Yolun', 'Oğlak MC ve 10. ev Güneş yerleşimi; görünür hedefler, sorumluluk ve uzun vadeli yapı kurma temasını güçlendiriyor.', ['MC — Oğlak', 'Güneş — Oğlak — 10. Ev', 'Satürn — Boğa — 1. Ev'], 'Kariyer yönü tek bir meslek adı değildir. Bu harita somut sonuç üretme, güvenilirlik geliştirme ve zamanı iyi yapılandırma üzerinden görünürlük kazanmayı destekler.'),
  module('money', 'career', 'Para Kazanma Potansiyelin', 'Boğa 2. ev ile 8. evdeki Venüs ve Plüton, kişisel kaynaklarla ortak finans arasında bilinçli bir denge kurulmasını vurguluyor.', ['2. Ev — Boğa', 'Venüs — Yay — 8. Ev', 'Plüton — Yay — 8. Ev'], 'Finans göstergeleri kazanç garantisi vermez. İstikrar, araştırma ve ortak kaynaklarda açık sınırlar bu haritanın para yönetimi temasını destekleyebilir.'),
  module('mc', 'career', 'MC – Kariyer Zirven', 'Oğlak MC, profesyonel itibarı sabır, sorumluluk ve ölçülebilir sonuçlar üzerinden geliştirme eğilimini anlatıyor.', ['MC — Oğlak 8.57°', 'MC yöneticisi Satürn — 1. Ev'], 'MC toplum önünde gelişebileceğin yönü simgeler. Bu test haritasında uzmanlık biriktirmek ve güvenilir bir yapı kurmak kariyer görünürlüğünü destekleyen ana temalardır.'),
  module('nodes', 'karmic', 'Karmik Göstergelerin', 'Aslan–Kova Ay Düğümü ekseni, topluluk içindeki rol ile kişisel yaratıcı görünürlük arasında gelişen dengeyi anlatıyor.', ['Kuzey Ay Düğümü — Aslan — 5. Ev', 'Güney Ay Düğümü — Kova — 11. Ev'], 'Ay Düğümleri değişmez kader değildir. Bu eksen, grubun beklentileri içinde kaybolmadan kişisel üretimini görünür kılmayı deneyimleyebileceğin sembolik bir gelişim çerçevesidir.'),
  module('chiron', 'karmic', 'Chiron – En Hassas Noktan', 'Chiron’un Yay burcunda 8. ev yerleşimi; güven, paylaşım ve anlam arayışında hassasiyet geliştirilen alanı gösteriyor.', ['Chiron — Yay 11.61° — 8. Ev', 'Chiron kavuşum Plüton — 0.16°', 'Chiron altmışlık Uranüs — 3.20°'], 'Bu yerleşim değişmez bir yara veya kader anlatmaz. Derin paylaşım, kontrol ve inanç temalarında deneyimle anlayış ve dayanıklılık geliştirebileceğin bir alanı simgeler.'),
  module('lilith', 'karmic', 'Lilith – Bastırdığın Tarafın', 'Mean Black Moon Lilith’in Yay burcunda 9. ev yerleşimi, düşüncelerini özgürce ifade etme ve sınırlarını sahiplenme temasını görünür kılıyor.', ['Lilith — Yay 23.34° — 9. Ev', 'Lilith üçgen Jüpiter — 1.91°', 'Lilith altmışlık Mars — 4.55°'], 'Lilith korkutucu veya olumsuz bir hüküm değildir. İnançlarını, merakını ve farklı düşünme ihtiyacını sorumlu biçimde ifade etmeyi öğrenme temasına işaret eder.'),
  module('houses', 'technical', '12 Ev Analizi', 'On iki ev, yaşam alanlarının burç dağılımını ve gezegenlerin hangi konularda daha görünür çalıştığını gösteriyor.', houses.map((house) => `${house.id}. Ev — ${house.sign}`), 'Önizlemedeki on iki ev doğum haritasının hesaplanan yerleşimlerinden gelir. Her ev, başlangıç burcu ve içindeki gezegenlerle birlikte değerlendirilir.'),
  module('aspects', 'technical', 'Gezegen Açıların', 'Belirgin açılar, haritadaki farklı ihtiyaçların nerede kolay aktığını ve nerede bilinçli denge istediğini gösteriyor.', ['Güneş ile Ay arasında destekleyici açı · 2,04°', 'Güneş ile Satürn arasında güçlü uyum · 0,11°', 'Ay ile Satürn arasında gerilimli karşıtlık · 1,92°'], 'Bu bağlantılar iyi veya kötü etiketi taşımaz; bazıları doğal bir akış, bazıları ise farklı ihtiyaçları birlikte yönetme fırsatı anlatır.'),
  module('forecast', 'forecast', '12 Aylık Yıllık Öngörün', 'Hesaplanan gökyüzü hareketleriyle önündeki on iki ayın temalarını incele.', [], 'Aylık kartlarda fırsatları, dikkat başlıklarını ve öne çıkan tarihleri görebilirsin.'),
];

const reportPoints = [...planets,
  { name: 'Juno', sign: 'Capricorn', degree: 7.9495, house: 10, retrograde: false },
  { name: 'Ceres', sign: 'Libra', degree: 4.4255, house: 7, retrograde: false },
  { name: 'Vesta', sign: 'Sagittarius', degree: 5.9069, house: 9, retrograde: false },
  { name: 'Pallas', sign: 'Leo', degree: 14.0675, house: 6, retrograde: false },
  { name: 'Vertex', sign: 'Virgo', degree: 25.86360979501967, house: 6, retrograde: false },
  { name: 'Part of Fortune', sign: 'Aquarius', degree: 18.1939, house: 11, retrograde: false },
];
const reportNames: Record<string, string> = { Sun: 'Güneş', Moon: 'Ay', Mercury: 'Merkür', Venus: 'Venüs', Mars: 'Mars', Jupiter: 'Jüpiter', Saturn: 'Satürn', Uranus: 'Uranüs', Neptune: 'Neptün', Pluto: 'Plüton', Chiron: 'Chiron', Lilith: 'Lilith', Juno: 'Juno', Ceres: 'Ceres', Vesta: 'Vesta', Pallas: 'Pallas', Vertex: 'Vertex', 'North Node': 'Kuzey Ay Düğümü', 'South Node': 'Güney Ay Düğümü', 'Part of Fortune': 'Şans Noktası' };
const signNames: Record<string, string> = { Aries: 'Koç', Taurus: 'Boğa', Gemini: 'İkizler', Cancer: 'Yengeç', Leo: 'Aslan', Virgo: 'Başak', Libra: 'Terazi', Scorpio: 'Akrep', Sagittarius: 'Yay', Capricorn: 'Oğlak', Aquarius: 'Kova', Pisces: 'Balık' };
const reportIndicators: PremiumReportIndicator[] = reportPoints.map((point) => { const pointAspects = aspects.filter((aspect) => aspect.from === point.name || aspect.to === point.name).map((aspect) => ({ label: `${reportNames[aspect.from] ?? aspect.from} ${aspect.type} ${reportNames[aspect.to] ?? aspect.to}`, orb: aspect.orb })); const label = `${reportNames[point.name] ?? point.name} — ${signNames[point.sign]}${point.house ? ` — ${point.house}. Ev` : ''}`; return { id: point.name.toLowerCase().replaceAll(' ', '-'), title: `${label} — ${Math.floor(point.degree)}°${String(Math.round((point.degree % 1) * 60)).padStart(2, '0')}'`, name: reportNames[point.name] ?? point.name, sign: signNames[point.sign], house: point.house, degree: point.degree, aspects: pointAspects, interpretation: '' }; });
const requiredPreviewIndicators = ['juno', 'ceres', 'vesta', 'pallas', 'vertex'];
if (__DEV__ && (reportIndicators.length !== 20 || requiredPreviewIndicators.some((id) => !reportIndicators.some((item) => item.id === id)))) throw new Error('Premium Preview fixture must contain 20 real indicators');
if (__DEV__) {
  const counts = reportIndicators.map(indicatorWordCount);
  const comments = reportIndicators.map(indicatorInterpretation);
  const visibleAspectText = reportIndicators.flatMap((item) => item.aspects.map(formatIndicatorAspect)).join(' ');
  const visibleCommentText = comments.join(' ');
  if (counts.some((count) => count < 45 || count > 65)) throw new Error(`Premium indicator copy length: ${counts.join(',')}`);
  if (new Set(comments).size !== reportIndicators.length) throw new Error('Premium indicator comments must be unique');
  if (/\b(conjunction|sextile|trine|square|opposition|orb)\b/i.test(visibleAspectText)) throw new Error('Premium indicator aspect labels must be Turkish');
  if (/fixture|major aspect|majör açı|deterministic|normalize|response|transit event|açı uydurulmadı|gerçek fixture haritası|temel çalışma biçimini gösteriyor|haritanın bütünüyle birlikte okunduğunda/i.test(visibleCommentText)) throw new Error('Premium indicator comments contain technical language');
}
const characterTitles = ['Genel Ruh Enerjisi', 'Kimliği ve Karakter', 'Duygusal Dünya', 'Zihin Yapısı ve İletişim', 'Aşk Dili ve Venüs Enerjisi', 'İlişki Kaderi', 'Tutku, Öfke ve Mücadele Biçimi', 'Kariyer ve Toplumsal Başarı', 'Para, Kriz ve Dönüşüm', 'Karmik Yön ve Ruh Dersi', 'Yara Noktası', 'Gölge Tarafı', 'Safir’den Net Karakter Özeti'];
const characterFocus = [
  'İçinde hem kontrollü ve dayanıklı hem de anlam arayan güçlü bir taraf var. Bir ortamın havasını hızlı kavrıyor, güven duymadığında gözlemlemeyi tercih ediyorsun. Kendini rahat hissettiğinde ise insanlara yön veren, toparlayıcı ve cesaretlendirici bir enerji gösterebiliyorsun.',
  'Kimliğini yalnız dışarıdan aldığın onayla kurmuyorsun. Kendi ölçülerine uyan bir hedef bulduğunda kararlı, sabırlı ve sonuç odaklı ilerleyebiliyorsun. Fazla sorumluluk aldığında sertleşmek yerine yükünü paylaşman, doğal gücünü daha sıcak ve ulaşılabilir biçimde göstermene yardımcı oluyor.',
  'Duyguların yüzeyde görünenden daha yoğun çalışıyor. Güven, sadakat ve anlaşılmak senin için önemli; incindiğinde hemen anlatmak yerine önce kendi içinde çözmeye çalışabiliyorsun. İhtiyacını zamanında dile getirmen, yakın ilişkilerde gereksiz mesafe oluşmasını önlüyor ve iç huzurunu koruyor.',
  'Zihnin ayrıntılar arasında hızlı bağlantı kuruyor; bir konunun arkasındaki düzeni ve olası sonucu erkenden görebiliyorsun. İletişimde açık ve somut olmayı sevsen de bazen düşüncelerini fazla kontrol edebilirsin. İlk fikrine tutunmadan karşı tarafı dinlemek kararlarının esnekliğini ve etkisini artırıyor.',
  'Sevgini güçlü ilgi, dürüstlük ve birlikte gelişme isteğiyle gösteriyorsun. Yakınlık ararken kişisel alanını da korumak istediğin için hem güven veren hem de seni kısıtlamayan ilişkiler sana iyi geliyor. Çekimi kalıcı bağdan ayırabildiğinde, sevgi dilin daha açık ve dengeli çalışıyor.',
  'İlişkiler hayatında yalnız mutluluk değil, kendini tanıma alanı da açıyor. Güçlü çekim hissettiğin kişiler bazen sınır, güven ve karşılıklılık konularını görünür kılabilir. Karşındaki kişiyi değiştirmeye çalışmadan kendi ihtiyacını netleştirmen, daha olgun ve sürdürülebilir bağlar kurmanı sağlıyor.',
  'Bir hedefe inandığında mücadele gücün yükseliyor ve kolay vazgeçmiyorsun. Öfken çoğu zaman sınırının aşıldığını veya emeğinin görülmediğini hissettiğinde belirginleşebilir. Tepkini biriktirmek yerine zamanında ve açık biçimde ifade etmen, cesaretini çatışmaya değil yapıcı harekete dönüştürmene yardımcı oluyor.',
  'Kariyerinde yalnız görev tamamlamak değil, zamanla yetki ve güven kazanmak istiyorsun. Sistem kurabildiğin, sorumluluk alabildiğin ve emeğinin sonucunu görebildiğin alanlarda daha güçlü ilerliyorsun. Başarıyı sürekli kendini kanıtlamakla karıştırmadığında, görünürlüğün daha doğal ve kalıcı hale geliyor.',
  'Para senin için yalnız harcama gücü değil, güven ve seçim özgürlüğü anlamı da taşıyor. Kriz anlarında hızlı çözüm üretme becerin var; fakat her yükü tek başına taşımaya çalışmak seni yorabilir. Düzenli plan, açık ortaklık koşulları ve uzun vadeli düşünmek kaynaklarını büyütüyor.',
  'Gelişim yönün, sana tanıdık gelen güvenli kalıpların dışına çıkıp kendi isteğini daha görünür kılmanı istiyor. Geçmişten gelen sorumluluk duygun güçlü bir temel sunuyor; ancak başkalarının beklentisini kendi yönünün önüne koymaman gerekiyor. Seçimlerinin arkasında durdukça içsel güvenin artıyor.',
  'En hassas olduğun konular seni zayıf yapmıyor; insanları ve olayları daha derinden anlamanı sağlıyor. Kırıldığında içine kapanmak veya kontrolü artırmak yerine yaşadığın duyguyu kabul etmen iyileşme alanını açıyor. Deneyimini anlamlı bir üretime dönüştürdüğünde başkalarına da güven verebiliyorsun.',
  'Bastırdığın tarafın çoğu zaman güçlü arzularını, öfkeni veya özgürlük ihtiyacını taşıyor. Uyum sağlamak adına kendini uzun süre geri çektiğinde bu enerji sert bir tepkiyle çıkabilir. Sınırını suçluluk duymadan söylemek ve isteğini sahiplenmek, gölge yanını yaratıcı bir güce dönüştürüyor.',
] as const;
const characterClosings = [
  'Bu yönünü bilinçli kullandığında hem kendi ihtiyacını daha net duyabilir hem de çevrendeki insanlarla daha dengeli ve güvenilir bir bağ kurabilirsin.',
  'Kendini yalnız sonuçlarınla değil, süreç içinde gösterdiğin emek ve dürüstlükle değerlendirdiğinde bu özelliğin hayatında artık çok daha sağlam bir yere oturuyor.',
  'Zorlandığın anda eski tepkiye dönmek yerine kısa bir duraklama yapman, gerçek ihtiyacını fark edip sana daha uygun bir seçim yapmana yardımcı oluyor.',
] as const;
const previewAnalysis = (title: string, index: number): PremiumReportAnalysis => { const first = reportIndicators[index % reportIndicators.length], second = reportIndicators[(index + 3) % reportIndicators.length]; const focus = characterFocus[index % characterFocus.length]; return { id: title === 'Aşk Dili ve Venüs Enerjisi' ? 'love-language' : `preview-${index}`, title, text: `${focus} ${first.name} ve ${second.name} temalarının sende birlikte çalışması, bu alanın hem güçlü yanını hem gelişim ihtiyacını görünür kılıyor. Günlük seçimlerinde kendine karşı daha açık olduğunda, otomatik tepkiler yerine sana gerçekten iyi gelen davranışı seçmen kolaylaşıyor. ${characterClosings[index % characterClosings.length]}`, indicators: [first.title, second.title], featured: title === 'Safir’den Net Karakter Özeti' }; };

export const DEV_PREMIUM_NATAL: PremiumNatalResponse['premium'] = {
  chart: { fixture: 'real-natal-2000-01-01-istanbul' },
  wheel: { houses, planets, angles: { asc: houses[0], dsc: houses[6], mc: houses[9], ic: houses[3] }, aspects },
  distributions: { dominantElement: 'Toprak', dominantModality: 'Sabit' }, report: { indicators: reportIndicators, character: characterTitles.map(previewAnalysis), natalQuestions: [], unavailable: [], metadata: { calculationVersion: 'premium-report-v2|20-indicators|real-development-fixture', partOfFortuneFormula: 'day_asc_moon_minus_sun' } }, modules, unavailable: [],
};

const eventText = 'Bu temas, koşullarını ve seçimlerini gözeterek değerlendirebileceğin bir farkındalık alanı oluşturabilir.';
const monthRecords = [
  ['2026-09','Eylül 2026','Kişisel Gelişim','Güneş ile Venüs arasında destekleyici açı','Merkür ile Jüpiter arasında gerilimli karşıtlık','2026-09-24'],
  ['2026-10','Ekim 2026','Kişisel Gelişim','Güneş ile Mars arasında güçlü uyum','Güneş ile kariyer noktası arasında zorlayıcı açı','2026-10-17'],
  ['2026-11','Kasım 2026','Kariyer & İş','Uranüs ile Güney Ay Düğümü arasında güçlü uyum','Mars ile Venüs arasında zorlayıcı açı','2026-11-29'],
  ['2026-12','Aralık 2026','Aşk & İlişkiler','Mars ile kökler noktası arasında destekleyici açı','Plüton ile Kuzey Ay Düğümü arasında gerilimli karşıtlık','2026-12-18'],
  ['2027-01','Ocak 2027','Kariyer & İş','Mars ile Satürn arasında güçlü uyum','Satürn ile kariyer noktası arasında zorlayıcı açı','2027-01-12'],
  ['2027-02','Şubat 2027','Aşk & İlişkiler','Venüs ile Ay arasında destekleyici açı','Mars’ın kendi konumuyla gerilimli karşıtlığı','2027-02-27'],
  ['2027-03','Mart 2027','Kariyer & İş','Neptün ile Güney Ay Düğümü arasında destekleyici açı','Venüs ile Satürn arasında zorlayıcı açı','2027-03-21'],
  ['2027-04','Nisan 2027','Kariyer & İş','Uranüs ile Kuzey Ay Düğümü arasında destekleyici açı','Güneş’in kendi konumuyla zorlayıcı açısı','2027-04-25'],
  ['2027-05','Mayıs 2027','Aşk & İlişkiler','Mars ile Jüpiter arasında güçlü uyum','Venüs ile Ay arasında gerilimli karşıtlık','2027-05-25'],
  ['2027-06','Haziran 2027','Aşk & İlişkiler','Mars ile Ay arasında destekleyici açı','Satürn ile Jüpiter arasında güçlü birleşim','2027-06-12'],
  ['2027-07','Temmuz 2027','Aşk & İlişkiler','Güneş ile Satürn arasında destekleyici açı','Jüpiter ile Mars arasında gerilimli karşıtlık','2027-07-15'],
  ['2027-08','Ağustos 2027','Kariyer & İş','Merkür ile kariyer noktası arasında güçlü uyum','Mars ile Jüpiter arasında gerilimli karşıtlık','2027-08-25'],
] as const;
const months: ForecastMonth[] = monthRecords.map(([id, label, theme, opportunity, attention, date]) => ({ id, label, mainTheme: `${theme} alanında gerçek transitlerin daha görünür olduğu bir ay.`, sections: [{ id: 'overview', title: theme, text: eventText }], opportunity: `${opportunity}: ${eventText}`, attention: `${attention}: Bilinçli tempo ve esneklik isteyebilir; kesin bir sonuç göstermez.`, importantDates: [{ date, title: opportunity, orb: 0.01 }] }));
const annualTitles = ['Bu yıl hayatıma biri girer mi?', 'Evlenme zamanı var mı?', 'Eski sevgili geri döner mi?', 'Ayrılık ya da barış ihtimali?', 'İş değişimi olur mu?', 'Terfi alır mıyım?', 'İş kurmak için uygun dönem?', 'Yurtdışı fırsatı var mı?', 'Maddi rahatlama ne zaman?', 'Borç kapanır mı?', 'Büyük para girişi var mı?', 'Ev alma zamanı?', 'Şehir değişikliği olur mu?', 'Şanslı aylar', 'Dikkat edilmesi gereken dönemler', 'Tutulma etkileri', 'Satürn sınavı'];
const forecastQuestions = annualTitles.map((title, index) => ({ id: `annual-question-${index + 1}`, title, answer: `${months[index % months.length].label} çevresindeki ${months[index % months.length].opportunity} Bu dönem olasılık ve zamanlama iklimini gösterir; belirli bir kişinin davranışını, kesin olayı veya finansal sonucu garanti etmez. Kararların, karşılıklı irade ve somut koşullarla birlikte değerlendirilmelidir.`, period: months[index % months.length].label, indicators: [months[index % months.length].importantDates[0].title] }));
export const DEV_ANNUAL_FORECAST: AnnualForecast = { calculationVersion: 'annual-v1|development-real-fixture', forecastStart: '2026-09-01', forecastEnd: '2027-09-01', summary: { love: 'Haziran 2027', career: 'Ağustos 2027', money: 'Mart 2027', change: 'Kasım 2026' }, questions: forecastQuestions, months };
