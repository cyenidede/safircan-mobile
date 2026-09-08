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

const planetFocusEn: Record<FreePlacementKey, string> = {
  sun: 'As you express your identity,',
  moon: 'In your emotional needs and inner world,',
  ascendant: 'In how you approach the world and the first impression you make,',
  mercury: 'In how you think, learn, and communicate,',
  venus: 'In your relationships, values, and aesthetic choices,',
  mars: 'In how you take action and face challenges,',
};
const signThemesEn: Record<string, string> = {
  Aries: 'courage, speed, and directness stand out; turning energy into action comes naturally to you.',
  Taurus: 'stability, patience, and tangible security stand out; you prefer to build what lasts step by step.',
  Gemini: 'curiosity, communication, and mental agility stand out; you connect different ideas quickly and flexibly.',
  Cancer: 'sensitivity, protectiveness, and belonging stand out; secure bonds give you direction and strength.',
  Leo: 'creativity, warmth, and self-expression stand out; visible contribution keeps you energized.',
  Virgo: 'order, care, and usefulness stand out; refining details helps you add value to the whole.',
  Libra: 'balance, harmony, and fairness stand out; you seek graceful common ground between different needs.',
  Scorpio: 'depth, intuition, and transformation stand out; you naturally look beneath the surface.',
  Sagittarius: 'freedom, exploration, and meaning stand out; experiences that broaden your horizons motivate you.',
  Capricorn: 'responsibility, resolve, and long-term goals stand out; steady effort helps you create reliable results.',
  Aquarius: 'originality, independence, and innovative thought stand out; unconventional solutions suit you.',
  Pisces: 'intuition, empathy, and imagination stand out; you readily notice and interpret subtle emotions.',
};
export function getPlacementCommentForLocale(planet: FreePlacementKey, sign: string, locale: 'tr' | 'en') {
  if (locale === 'tr') return getPlacementComment(planet, sign);
  return `${planetFocusEn[planet]} ${signThemesEn[sign] ?? 'your distinctive way of expressing yourself stands out; you make sense of experience in your own rhythm.'}`;
}
