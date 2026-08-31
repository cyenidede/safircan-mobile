import type { PremiumReportAspect, PremiumReportIndicator } from '@/features/astrology/api/types';

const aspectTerms = [
  { pattern: /\b(conjunction|kavuşum)\b/i, phrase: 'güçlü birleşim', supportive: true },
  { pattern: /\b(sextile|sekstil|altmışlık)\b/i, phrase: 'destekleyici açı', supportive: true },
  { pattern: /\b(trine|üçgen)\b/i, phrase: 'güçlü uyum', supportive: true },
  { pattern: /\b(square|kare)\b/i, phrase: 'zorlayıcı açı', supportive: false },
  { pattern: /\b(opposition|karşıt)\b/i, phrase: 'gerilimli karşıtlık', supportive: false },
] as const;

function parsedAspect(aspect: PremiumReportAspect) {
  const match = aspectTerms.find((item) => item.pattern.test(aspect.label));
  if (!match) return { from: aspect.label, to: '', phrase: 'belirgin bağlantı', supportive: true };
  const token = aspect.label.match(match.pattern);
  const from = token?.index === undefined ? aspect.label : aspect.label.slice(0, token.index).trim();
  const to = token?.index === undefined ? '' : aspect.label.slice(token.index + token[0].length).trim();
  return { from, to, phrase: match.phrase, supportive: match.supportive };
}

export function formatIndicatorAspect(aspect: PremiumReportAspect) {
  const { from, to, phrase } = parsedAspect(aspect);
  const names = to ? `${from} ile ${to} arasında` : from;
  return `${names} ${phrase} · ${aspect.orb.toFixed(2).replace('.', ',')}°`;
}

const pairMeanings: Record<string, string> = {
  'sun:Ay': 'Duygularınla iraden çoğu zaman birbirini destekliyor; ne istediğini hissettiğinde kararlarının arkasında daha rahat durabiliyorsun',
  'moon:Güneş': 'İçinden gelenlerle bilinçli seçimlerin çoğu zaman aynı yönde ilerliyor; bu da duygularını daha güvenli ifade etmene yardımcı oluyor',
  'mercury:Mars': 'Zihnin hızlı çalışıyor ve düşündüğünü eyleme geçirmekten çekinmiyorsun; sözlerinin aceleci değil etkili olması için ritmini gözetmen önemli',
  'venus:Mars': 'Özgürlük arzunla yoğun çekim ihtiyacın zaman zaman çatışabiliyor; ilişkide hem alan hem de güçlü yakınlık istemen tutkuyu belirginleştiriyor',
  'mars:Merkür': 'Düşüncelerin hareket gücünü besliyor; bir fikre inandığında onu savunmak ve hızla uygulamaya geçirmek senin için doğal hale geliyor',
  'jupiter:Mars': 'Cesaretin fırsatları görmeni kolaylaştırıyor; girişimde bulunduğunda büyüme isteğin hızla harekete dönüşebiliyor',
  'saturn:Güneş': 'İradenle sorumluluk duygun uyumlu çalışıyor; sabırlı kaldığında hedeflerini sağlam ve kalıcı sonuçlara dönüştürebiliyorsun',
  'uranus:Ay': 'Duygusal yakınlık isterken özgür kalma ihtiyacın da güçlü; ani uzaklaşmalar yerine bu ihtiyacı açıkça anlatman ilişkilerini rahatlatır',
  'neptune:Venüs': 'Sevgiyi ince, romantik ve idealist algılıyorsun; karşındaki kişiyi olduğu haliyle görmek kalbini gereksiz hayal kırıklıklarından korur',
  'pluto:Uranüs': 'Değişim ihtiyacın yüzeyde kalmıyor; eski bir düzeni bıraktığında hayatını kökten yenileyecek kadar güçlü kararlar alabiliyorsun',
  'chiron:Plüton': 'Yaşadığın kırılmalar sende yüzeysel kalmıyor; seni kökten dönüştürebiliyor ve zamanla başkalarının acısını daha derinden anlamanı sağlıyor',
  'lilith:Jüpiter': 'Kendi doğrunu savunma cesaretin güçlü; özgür düşünceni ölçülü kullandığında çevrene de daha geniş bir bakış kazandırabiliyorsun',
  'juno:Güneş': 'Bağlılık senin için kimliğinden ayrı değil; seçtiğin eşin hedeflerine saygı duyması ve birlikte gurur duyacağın bir gelecek kurmanız önem taşıyor',
  'vesta:Venüs': 'Sevdiğin kişiye veya değer verdiğin bir amaca derinden bağlanabiliyorsun; adanmışlığın içten geldiğinde odağın kolay kolay dağılmıyor',
  'pallas:Uranüs': 'Özgün fikirlerle stratejik aklı aynı anda kullanıyorsun; beklenmedik sorunlarda başkalarının göremediği yeni bir çözüm yolu bulabilirsin',
};

const quietMeanings: Record<string, string> = {
  'north-node': 'Kendi sesini duyurdukça ve üretiminden utanmadıkça gelişim yolun daha canlı ve anlamlı hale geliyor',
  'south-node': 'Kalabalıkların ihtiyacını okumak tanıdık geliyor; asıl ilerleme, kendi isteğini de bu denklemin içine almanla başlıyor',
  ceres: 'Sevgi gösterirken denge kurman güçlü bir yetenek; aynı özeni kendi ihtiyaçlarına da yöneltmen duygusal güvenini artırıyor',
  vertex: 'Karşına çıkan kişiler, ayrıntılara yaklaşımını yenileyerek yaşamını daha işlevli ve bilinçli kurmana yardımcı oluyor',
  'part-of-fortune': 'İnsanlarla ortak bir gelecek fikri etrafında buluştuğunda içindeki rahatlık ve tatmin duygusu daha kolay açığa çıkıyor',
};

function connection(indicator: PremiumReportIndicator) {
  if (!indicator.aspects.length) return quietMeanings[indicator.id] ?? 'Kendi ihtiyaçlarını açıkça tanıman, bu yönünü daha dengeli ve bilinçli kullanmanı kolaylaştırıyor';
  const first = parsedAspect(indicator.aspects[0]);
  const other = first.from === indicator.name ? first.to : first.from;
  const precise = pairMeanings[`${indicator.id}:${other}`];
  if (precise) return precise;
  return first.supportive
    ? `${other || 'Haritandaki diğer güçlü yanların'}, bu alandaki yeteneğini daha rahat ve güvenli kullanmana yardımcı oluyor`
    : `${other || 'Haritandaki başka bir ihtiyaç'}, burada zaman zaman iç gerilim yaratıyor; iki tarafı da dinlediğinde daha dengeli seçimler yapabiliyorsun`;
}

type Copy = (place: string, link: string) => string;
const copy: Record<string, Copy> = {
  sun: (p, l) => `Güneş’in ${p}, kimliğini hedeflerin, sorumlulukların ve görünür başarıların üzerinden kurduğunu anlatıyor. Kendini ortaya koyarken kalıcı bir iz bırakmak, yaptığın işin ciddiye alınması ve yaşamına yön veren bir amaç bulmak istiyorsun. ${l}. Öz güvenin, emek verdiğin bir konuda ustalaştığını gördükçe daha sağlam bir zemine oturuyor.`,
  moon: (p, l) => `Ay’ın ${p}, duygusal güveni yüzeysel yakınlıktan çok derin bağlar ve dürüst paylaşım içinde aradığını gösteriyor. İnsanların gerçek niyetlerini sezmek, ilişkilerde sadakati hissetmek ve duyguların özüne inmek senin için önemli. ${l}. İç dünyanı korurken ihtiyaçlarını açıkça söylemek, ilişkilerinde hem huzuru hem de dayanıklılığı büyütebilir.`,
  mercury: (p, l) => `Merkür’ün ${p}, düşüncelerini düzenli, amaçlı ve sonuç odaklı biçimde kurduğunu gösteriyor. Öğrenirken konunun mantığını, işe yarayan tarafını ve uzun vadeli değerini görmek istiyorsun; sözlerini de kolay harcamıyorsun. ${l}. Bilgini paylaşırken katılaşmadan meraka alan açman, güçlü zihinsel disiplinini daha yaratıcı ve etkileyici kılar.`,
  venus: (p, l) => `Venüs’ün ${p}, aşkta hem özgürce nefes almak hem de duygusal olarak derin bağlanmak istediğini anlatıyor. Çekim duyduğunda dürüstlük, macera ve güçlü paylaşım aynı anda önem kazanıyor. ${l}. Romantik beklentilerini açık konuşmak ve tutkuyla idealizasyonu ayırmak, ilişkilerinde güveni korurken adanmışlığını daha sağlıklı yaşamanı sağlar.`,
  mars: (p, l) => `Mars’ın ${p}, enerjini özgün fikirler, toplumsal hedefler ve birlikte üretme isteğiyle harekete geçirdiğini gösteriyor. Mücadele ederken bağımsız düşünür, alışılmış yöntemleri sorgular ve geleceğe dönük çözümler ararsın. ${l}. Öfkeni biriktirmek yerine hedefe dönüştürmen, cesaretini hem kendin hem çevren için yapıcı bir güce çevirebilir.`,
  jupiter: (p, l) => `Jüpiter’in ${p}, fırsatların çoğu zaman cesaret gösterdiğinde, ilk adımı attığında ve kendi yönüne güvendiğinde açıldığını anlatıyor. Hayata iyimser, doğrudan ve deneyerek öğrenen bir tavırla yaklaşabilirsin. ${l}. Büyüme isteğini sabırsızlığa dönüştürmeden ilerlemek, inancını somut sonuçlarla besler ve çevrene de girişim cesareti verir.`,
  saturn: (p, l) => `Satürn’ün ${p}, güven, beden, öz değer ve kişisel duruş konularında sabırla olgunlaştığını gösteriyor. Hayat senden kendi sınırlarını kurmanı, kaynaklarını dikkatle yönetmeni ve acele etmeden sağlam bir temel oluşturmanı istiyor. ${l}. Kendine karşı aşırı sertleşmeden sorumluluk almak, zamanla sakin ama kolay sarsılmayan bir güç geliştirmeni sağlar.`,
  uranus: (p, l) => `Uranüs’ün ${p}, topluluklar, arkadaşlıklar ve gelecek planları içinde özgün yanını güçlü biçimde ortaya çıkardığını anlatıyor. Benzer düşünen insanlarla yenilik üretmek isterken hiçbir gruba bütünüyle benzemek istemeyebilirsin. ${l}. Ani kopuşlar yerine değişim ihtiyacını erken ifade etmek, özgürlüğünü korurken kalıcı iş birlikleri kurmana yardımcı olur.`,
  neptune: (p, l) => `Neptün’ün ${p}, ortak idealler, dostluklar ve insanlığa fayda sağlayan hayaller konusunda güçlü bir sezgi taşıdığını gösteriyor. İnsanların potansiyelini kolayca görebilir, büyük bir amaca ait olmayı özleyebilirsin. ${l}. Kime ve hangi hedefe emek verdiğini netleştirmek, ilhamını hayal kırıklığından korur ve vizyonunu uygulanabilir hale getirir.`,
  pluto: (p, l) => `Plüton’un ${p}, yakınlık, ortak kaynaklar ve krizlerden sonra yeniden güçlenme alanında yoğun bir dönüşüm kapasitesi verdiğini anlatıyor. Kolay kolay yüzeyde kalmaz; gerçeği, niyeti ve saklı gücü anlamak istersin. ${l}. Kontrolü paylaşmayı öğrenmek, psikolojik derinliğini korkuya değil güvene ve iyileştirici bir içgörüye dönüştürebilir.`,
  chiron: (p, l) => `Chiron’un ${p}, güvenmek, paylaşmak ve hayatın büyük anlamını kavramak konusunda kolay kolay yüzeyde kalmayan bir hassasiyet gösteriyor. Krizler veya kayıplar, inançlarını yeniden kurmana neden olabilir. ${l}. Kendi kırılganlığını saklamak yerine anlamlandırdığında, başkalarının dönüşüm süreçlerine de sakinlik ve cesaret taşıyan bir rehberlik geliştirebilirsin.`,
  lilith: (p, l) => `Lilith’in ${p}, düşüncelerini özgürce söyleme, kendi doğrunu arama ve kabul görmeyen yanlarını sahiplenme ihtiyacını görünür kılıyor. İnançlar veya sınırlar dayatıldığında güçlü tepki verebilirsin. ${l}. Merakını ve itirazını bilinçli kullandığında, bastırdığın tarafın çatışma yaratmak yerine cesur bir özgünlük ve içsel bağımsızlık kaynağına dönüşür.`,
  juno: (p, l) => `Juno’nun ${p}, ilişkide ciddiyet, güvenilirlik ve gelecek kurma isteğini öne çıkarıyor. Eşinde hedef sahibi, sorumluluk alabilen ve toplum önündeki duruşuna saygı duyan bir yapı arayabilirsin. ${l}. İlişkinin yalnızca sorumluluğa dönüşmesine izin vermeden sıcaklığı koruman, uzun vadeli uyumu ve karşılıklı saygıyı besler.`,
  ceres: (p, l) => `Ceres’in ${p}, bakım verme ve alma biçiminde adalet, karşılıklılık ve huzurlu bir birliktelik aradığını anlatıyor. Sevdiğin kişileri dinleyerek, ortamı yumuşatarak ve ihtiyaçlar arasında denge kurarak beslersin. ${l}. Herkesi memnun etmeye çalışmadan kendi ihtiyacını da masaya koyman, ilişkilerinde gerçek güven ve korunma duygusunu güçlendirir.`,
  vesta: (p, l) => `Vesta’nın ${p}, bir inanca, araştırmaya veya içsel dönüşüm sürecine bütün kalbinle adanabildiğini gösteriyor. Odaklandığında yüzeysel cevaplarla yetinmez, anlamın ve deneyimin derinine inmeyi istersin. ${l}. Kendini tüketmeden düzenli yalnızlık alanları yaratman, yoğun bağlılığını berrak bir amaca ve sürdürülebilir üretime dönüştürür.`,
  pallas: (p, l) => `Pallas’ın ${p}, sorunları yaratıcı bir özgüvenle ele aldığını ve gündelik işleyişte başkalarının kaçırdığı örüntüleri fark edebildiğini anlatıyor. Strateji kurarken hem büyük resmi hem uygulanabilir ayrıntıları görmek istersin. ${l}. Fikrini kanıtlama baskısını azalttığında, zekân insanları bir araya getiren pratik ve etkileyici çözümler üretir.`,
  'north-node': (p, l) => `Kuzey Ay Düğümü’nün ${p}, gelişim yolunun kendi yaratıcılığını görünür kılmaktan, kalbinin sesini izlemekten ve kişisel cesaretini sahiplenmekten geçtiğini gösteriyor. Grubun onayına sığınmak zaman zaman daha kolay gelebilir. ${l}. Hayat senden seyirci kalmak yerine üretimini ortaya koymanı ve neşeni ciddiye almanı istiyor.`,
  'south-node': (p, l) => `Güney Ay Düğümü’nün ${p}, toplulukları okumak, mesafeli düşünmek ve ortak hedeflere katkı sunmak konusunda tanıdık bir beceri taşıdığını anlatıyor. Akılcı duruş güvenli alanın olabilir; fakat kişisel arzunu geri plana atabilirsin. ${l}. Bildiğin kolektif rolden çıkıp kendi yaratıcılığına yer açmak, geçmiş alışkanlıklarını verimli bir desteğe dönüştürür.`,
  'part-of-fortune': (p, l) => `Şans Noktası’nın ${p}, doğal akış ve tatmin duygusunun özgün insanlarla buluştuğunda, geleceğe dönük fikirler ürettiğinde ve topluma katkı sunduğunda güçlendiğini gösteriyor. Farklılığını saklamadan paylaşmak sana kapılar açabilir. ${l}. Başarıyı yalnız kişisel sonuçla değil ortak faydayla birleştirdiğinde, hayatın daha zahmetsiz ilerlediğini hissedebilirsin.`,
  vertex: (p, l) => `Vertex’in ${p}, hayatında iz bırakan karşılaşmaların iş hayatın, günlük düzenin ve yaşam alışkanlıkların ya da hizmet verdiğin alanlar üzerinden gelebileceğini anlatıyor. Hayatına iz bırakan insanlar ayrıntıları görmeni ve düzenini yenilemeni sağlar. ${l}. Böyle karşılaşmalar, daha bilinçli seçimler yapmana ve yaşamını sadeleştirerek geliştirmene vesile olabilir.`,
};

export function indicatorInterpretation(indicator: PremiumReportIndicator) {
  const place = `${indicator.sign} burcunda ve ${indicator.house ? `${indicator.house}. evde` : 'haritanın kişisel alanında'} olması`;
  return (copy[indicator.id] ?? copy.sun)(place, connection(indicator));
}

export const indicatorWordCount = (indicator: PremiumReportIndicator) => indicatorInterpretation(indicator).trim().split(/\s+/).length;
