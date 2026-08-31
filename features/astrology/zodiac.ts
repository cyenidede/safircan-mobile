const TURKISH_ZODIAC_SIGNS: Readonly<Record<string, string>> = {
  Aries: 'Koç',
  Taurus: 'Boğa',
  Gemini: 'İkizler',
  Cancer: 'Yengeç',
  Leo: 'Aslan',
  Virgo: 'Başak',
  Libra: 'Terazi',
  Scorpio: 'Akrep',
  Sagittarius: 'Yay',
  Capricorn: 'Oğlak',
  Aquarius: 'Kova',
  Pisces: 'Balık',
};

export const ZODIAC_SIGNS = Object.entries(TURKISH_ZODIAC_SIGNS).map(([id, name]) => ({ id, name }));

export function localizeZodiacSign(sign: string) {
  return TURKISH_ZODIAC_SIGNS[sign] ?? sign;
}

export function localizeZodiacSignUppercase(sign: string) {
  return localizeZodiacSign(sign).toLocaleUpperCase('tr-TR');
}
