import { localizeZodiacSign } from './zodiac';

const elements: Record<string, number> = { Aries: 0, Leo: 0, Sagittarius: 0, Taurus: 1, Virgo: 1, Capricorn: 1, Gemini: 2, Libra: 2, Aquarius: 2, Cancer: 3, Scorpio: 3, Pisces: 3 };
const modalities: Record<string, number> = { Aries: 0, Cancer: 0, Libra: 0, Capricorn: 0, Taurus: 1, Leo: 1, Scorpio: 1, Aquarius: 1, Gemini: 2, Virgo: 2, Sagittarius: 2, Pisces: 2 };

// Web'deki ücretsiz Burç Uyumu aracıyla aynı Güneş burcu algoritmasıdır.
// Profesyonel Sinastri hesaplamasında kullanılmaz.
export function compatibility(a: string, b: string) {
  const same = a === b;
  const elementMatch = elements[a] === elements[b];
  const complementary = Math.abs((elements[a] ?? 0) - (elements[b] ?? 0)) === 2;
  const general = Math.min(94, 58 + (same ? 18 : 0) + (elementMatch ? 17 : 0) + (complementary ? 10 : 0) + (modalities[a] !== modalities[b] ? 5 : -2));
  const love = Math.min(96, general + (complementary ? 7 : elementMatch ? 3 : -3));
  const communication = Math.min(95, general + ([2].includes(elements[a]) || [2].includes(elements[b]) ? 6 : -2));
  const passion = Math.min(97, general + ([0, 3].includes(elements[a]) ? 7 : 0) + ([0, 3].includes(elements[b]) ? 5 : 0));
  const longTerm = Math.min(94, general + (modalities[a] === 1 || modalities[b] === 1 ? 6 : 0) - (modalities[a] === modalities[b] && !same ? 4 : 0));
  return {
    general,
    love,
    communication,
    passion,
    longTerm,
    text: `${localizeZodiacSign(a)} ile ${localizeZodiacSign(b)} birlikteliğinde genel akış ${elementMatch ? 'benzer ihtiyaçları kolay fark etmeye' : 'farklı bakışları birbirinden öğrenmeye'} açıktır. İletişimde beklentileri açık söylemek, varsayım yerine merakı seçmek ilişkinin güçlü yanlarını büyütebilir.`,
  };
}
