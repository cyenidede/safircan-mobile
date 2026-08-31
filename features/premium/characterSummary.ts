import type { PremiumNatalResponse, PremiumReportIndicator } from '@/features/astrology/api/types';

type PremiumData = PremiumNatalResponse['premium'];
const water = new Set(['Yengeç', 'Akrep', 'Balık', 'Cancer', 'Scorpio', 'Pisces']);
const fire = new Set(['Koç', 'Aslan', 'Yay', 'Aries', 'Leo', 'Sagittarius']);
const earth = new Set(['Boğa', 'Başak', 'Oğlak', 'Taurus', 'Virgo', 'Capricorn']);

function point(data: PremiumData, id: string): PremiumReportIndicator | undefined { return data.report.indicators.find((item) => item.id === id); }
function inHouses(item: PremiumReportIndicator | undefined, ...houses: number[]) { return item?.house ? houses.includes(item.house) : false; }

export function createNetCharacterSummary(data: PremiumData) {
  const sun = point(data, 'sun'), moon = point(data, 'moon'), mercury = point(data, 'mercury'), venus = point(data, 'venus'), mars = point(data, 'mars');
  const saturn = point(data, 'saturn'), jupiter = point(data, 'jupiter'), pluto = point(data, 'pluto'), chiron = point(data, 'chiron'), lilith = point(data, 'lilith');
  const north = point(data, 'north-node'), south = point(data, 'south-node');
  const degrees = [sun, moon, mercury, venus, mars, saturn, jupiter, pluto].reduce((sum, item) => sum + Math.round(item?.degree ?? 0), 0);
  const variant = degrees % 3;
  const resilient = earth.has(sun?.sign ?? '') || earth.has(saturn?.sign ?? '') || inHouses(saturn, 1, 4, 10);
  const perceptive = water.has(moon?.sign ?? '') || inHouses(moon, 4, 7, 8, 12) || inHouses(pluto, 1, 8, 12);
  const visible = fire.has(sun?.sign ?? '') || fire.has(point(data, 'ascendant')?.sign ?? '') || inHouses(sun, 1, 5, 10);
  const independent = inHouses(mars, 1, 9, 10, 11) || inHouses(lilith, 1, 9, 11) || data.distributions.dominantModality === 'Sabit';
  const relationalDepth = inHouses(venus, 7, 8) || inHouses(moon, 7, 8) || water.has(venus?.sign ?? '');
  const hardLinks = data.report.indicators.flatMap((item) => item.aspects).filter((item) => /kare|karşıt|square|opposition/i.test(item.label)).length;
  const sensitiveGrowth = Boolean(chiron) && (inHouses(chiron, 1, 4, 7, 8, 12) || water.has(chiron?.sign ?? ''));
  const directionIsCreative = inHouses(north, 1, 5, 9, 10) || fire.has(north?.sign ?? '');

  const openings = [
    `Sen kolay kolay yüzeyde kalan biri değilsin; bir insanı, hedefi ya da yaşadığın olayı gerçekten önemsediğinde bütün dikkatini ona verebiliyorsun.`,
    `Senin karakterinde sakin görünen ama içeride sürekli çalışan güçlü bir irade var; karar verdiğinde dışarıdan beklenenden çok daha dayanıklı olabiliyorsun.`,
    `Sen hem kendi yönünü çizmek hem de yaptığın şeyin gerçek bir karşılığı olduğunu görmek isteyen birisin; boş çaba seni uzun süre taşımaz.`,
  ];
  const strengthOne = resilient
    ? `Güçlü tarafın, zor koşullarda düzen kurabilmen ve uzun vadeli bir hedef uğruna sabır gösterebilmen; sorumluluk arttığında çoğu zaman daha ciddi ve güvenilir davranıyorsun.`
    : `Güçlü tarafın, şartlar değiştiğinde hızlıca yeni bir yol görebilmen; merakın ve hareket kabiliyetin seni sıkıştığın yerde uzun süre beklemekten koruyor.`;
  const strengthTwo = perceptive
    ? `İnsanları ve olayları yüzeyden değerlendirmek sana göre değil; söylenmeyeni sezebilir, bir ortamın duygusunu erken fark edebilir ve kriz anında meselenin özüne inebilirsin.`
    : `Olayları serinkanlı değerlendirebilir, farklı parçalar arasındaki bağlantıyı görebilir ve duygular yoğunlaştığında bile işe yarayan bir çözüm bulmaya yönelebilirsin.`;
  const strengthThree = visible
    ? `Doğru yerde olduğunda dikkat çeken ve güven veren bir tarafın var; emeğine inandığında insanları peşinden sürüklemeden de doğal bir ağırlık oluşturabiliyorsun.`
    : `Gösterişten çok içerik üretmen seni güvenilir kılıyor; insanlar sende sözden çok davranışla kendini kanıtlayan, sakin ama tutarlı bir güç fark edebilir.`;
  const shadow = hardLinks >= 3
    ? `En büyük gelişim alanın, her şeyi tek başına taşımak ve güçlü görünmek zorunda olmadığını kabul etmek. Baskı arttığında katılaşmak yerine destek istemen hem ilişkilerini hem kararlarını rahatlatır.`
    : `En büyük gelişim alanın, kendini sürekli kanıtlamaya çalışmadan kendi değerine güvenmek. Acele karar vermeden iç sesinle mantığını aynı masada tutman seçimlerini belirgin biçimde güçlendirir.`;
  const innerGrowth = sensitiveGrowth
    ? `Hassasiyetini zayıflık saymadığında, yaşadığın kırılmaları anlayışa dönüştürüp başkalarına da güven veren bir olgunluk geliştirebilirsin.`
    : relationalDepth
      ? `Yakınlık kurarken hem kendi sınırını hem karşındaki insanın ihtiyacını gözetmen, ilişkilerinde güveni ve duygusal açıklığı belirgin biçimde büyütür.`
    : independent
      ? `Özgürlüğünü korurken bağ kurmayı öğrenmen, seni yalnızca güçlü değil aynı zamanda daha ulaşılabilir ve etkili biri haline getirir.`
      : `Kendi ihtiyaçlarını küçümsemeden ifade ettiğinde, hem sınırlarını koruyabilir hem de çevrendeki insanlarla daha gerçek bir yakınlık kurabilirsin.`;
  const endings = directionIsCreative
    ? [
      `Senin yolun başkasının düzenini kopyalamak değil; kendi üretimini görünür kılmak, cesaretini saklamamak ve sana gerçekten anlam veren hayatı adım adım kurmak.`,
      `Asıl gücün, yeteneğini başkalarının onayına göre küçültmediğinde ortaya çıkıyor. Kendi sesine yer açtıkça hem daha yaratıcı hem de daha kararlı bir iz bırakıyorsun.`,
      `Hayatında en çok, kendi seçiminin sorumluluğunu aldığında büyüyorsun. İçinden geleni disiplinle birleştirdiğinde kalıcı, güven veren ve sana ait bir yön oluşturabiliyorsun.`,
    ][variant]
    : [
      `Senin asıl gücün, dağıldığında bile yeniden toparlanıp neyin gerçekten önemli olduğunu bulabilmen. Kendi ölçünü kurduğunda çevrenden daha az etkileniyor ve daha net ilerliyorsun.`,
      `Kendini başkalarının beklentileriyle ölçmediğin dönemlerde hem ilişkilerinde hem işinde daha güçlü bir etki bırakıyorsun. Sana iyi gelen yol, iç huzurunu somut seçimlerle koruduğun yol.`,
      `Zamanla öğrendiğin en değerli şey, gücün yalnız direnmekten gelmediği. Esneyebildiğinde, paylaşabildiğinde ve kendi sınırına saygı duyduğunda çok daha sağlam ilerliyorsun.`,
    ][variant];

  return [openings[variant], strengthOne, strengthTwo, strengthThree, shadow, innerGrowth, endings].join(' ');
}

export const summaryWordCount = (data: PremiumData) => createNetCharacterSummary(data).trim().split(/\s+/).length;
