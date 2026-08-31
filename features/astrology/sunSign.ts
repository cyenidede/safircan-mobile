const signByMonthAndDay = [
  { start: 120, sign: 'Aquarius' },
  { start: 219, sign: 'Pisces' },
  { start: 321, sign: 'Aries' },
  { start: 420, sign: 'Taurus' },
  { start: 521, sign: 'Gemini' },
  { start: 621, sign: 'Cancer' },
  { start: 723, sign: 'Leo' },
  { start: 823, sign: 'Virgo' },
  { start: 923, sign: 'Libra' },
  { start: 1023, sign: 'Scorpio' },
  { start: 1122, sign: 'Sagittarius' },
  { start: 1222, sign: 'Capricorn' },
] as const;

// Güneş'in burç değiştirdiği tarih yıl ve saate göre kayabildiği için bu
// günlerde saat olmadan kesin sonuç üretmiyoruz.
const uncertainTransitionDays = new Set([
  119, 120, 121,
  218, 219, 220,
  320, 321, 322,
  419, 420, 421,
  520, 521, 522,
  620, 621, 622,
  722, 723, 724,
  822, 823, 824,
  922, 923, 924,
  1022, 1023, 1024,
  1121, 1122, 1123,
  1221, 1222, 1223,
]);

export type DateOnlySunResult =
  | { status: 'known'; sign: string }
  | { status: 'time-required'; sign: null };

export function getDateOnlySunSign(date: Date): DateOnlySunResult {
  const value = (date.getMonth() + 1) * 100 + date.getDate();
  if (uncertainTransitionDays.has(value)) return { status: 'time-required', sign: null };

  const match = [...signByMonthAndDay].reverse().find(({ start }) => value >= start);
  return { status: 'known', sign: match?.sign ?? 'Capricorn' };
}
