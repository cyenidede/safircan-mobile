export type FreePlacementKey = 'sun' | 'moon' | 'ascendant' | 'mercury' | 'venus' | 'mars';

const planetFocus: Record<FreePlacementKey, string> = {
  sun: 'Kimliğini ortaya koyarken',
  moon: 'Duygusal ihtiyaçların ve iç dünyanda',
  ascendant: 'Dış dünyaya yaklaşımın ve ilk izlenimlerinde',
  mercury: 'Düşünme, öğrenme ve iletişim biçiminde',
  venus: 'İlişkilerin, değerlerin ve estetik seçimlerinde',
  mars: 'Harekete geçme ve mücadele tarzında',
};

const signThemes: Record<string, string> = {
  Aries: 'cesaret, hız ve doğrudanlık öne çıkar; enerjini beklemeden eyleme dönüştürmek sana doğal gelir.',
  Taurus: 'istikrar, sabır ve somut güven arayışı belirgindir; kalıcı olanı adım adım kurmayı tercih edersin.',
  Gemini: 'merak, iletişim ve zihinsel hareketlilik öne çıkar; farklı fikirler arasında hızlı ve esnek bağlar kurarsın.',
  Cancer: 'duyarlılık, koruyuculuk ve aidiyet ihtiyacı belirgindir; güvenli bağlar kurmak sana yön ve güç verir.',
  Leo: 'yaratıcılık, sıcaklık ve kendini ifade etme isteği öne çıkar; görünür katkılar sunmak seni canlı tutar.',
  Virgo: 'düzen, dikkat ve fayda üretme arzusu belirgindir; ayrıntıları iyileştirerek bütüne değer katarsın.',
  Libra: 'denge, uyum ve adalet duygusu öne çıkar; farklı ihtiyaçlar arasında zarif bir ortaklık kurmaya çalışırsın.',
  Scorpio: 'derinlik, sezgi ve dönüşüm gücü belirgindir; yüzeyin altındaki gerçekleri anlamaya doğal olarak yönelirsin.',
  Sagittarius: 'özgürlük, keşif ve anlam arayışı öne çıkar; ufkunu genişleten deneyimler sana güçlü bir motivasyon verir.',
  Capricorn: 'sorumluluk, kararlılık ve uzun vadeli hedefler belirgindir; emek vererek güvenilir sonuçlar oluşturursun.',
  Aquarius: 'özgünlük, bağımsızlık ve yenilikçi düşünce öne çıkar; alışılmışın dışında çözümler geliştirmek sana iyi gelir.',
  Pisces: 'sezgi, empati ve hayal gücü belirgindir; çevrendeki ince duyguları kolayca fark edip anlamlandırırsın.',
};

export function getPlacementComment(planet: FreePlacementKey, sign: string) {
  const theme = signThemes[sign] ?? 'kendine özgü bir ifade biçimi belirgindir; deneyimlerini kişisel ritminle anlamlandırırsın.';
  return `${planetFocus[planet]} ${theme}`;
}
