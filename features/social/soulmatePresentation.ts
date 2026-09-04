import type { SoulmateCandidate, SoulmateMatch } from './api';

const CATEGORY_ORDER = ['attraction', 'emotional', 'communication', 'longTerm'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  attraction: 'Çekim',
  emotional: 'Duygusal Uyum',
  communication: 'İletişim',
  longTerm: 'Uzun Vadeli Potansiyel',
};

export function orderedMatchCategories(match: SoulmateMatch) {
  const byId = new Map(match.categories.map((category) => [category.id, category]));
  return CATEGORY_ORDER.flatMap((id) => {
    const category = byId.get(id);
    return category && Number.isFinite(category.score)
      ? [{ ...category, label: CATEGORY_LABELS[id] ?? category.label }]
      : [];
  });
}

const themeText: Record<string, string> = {
  attraction: 'aranızdaki çekim',
  emotional: 'duygusal yakınlığınız',
  communication: 'birbirinizi anlama biçiminiz',
  longTerm: 'ilişkinin uzun vadeli tarafı',
};

export function soulmateReason(match: SoulmateMatch) {
  const strongest = orderedMatchCategories(match)
    .sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
    .slice(0, 2);
  if (!strongest.length) return null;
  if (strongest.length === 1) return `${themeText[strongest[0].id] ?? strongest[0].label} eşleşmenizde öne çıkıyor.`;
  const [first, second] = strongest;
  return `${themeText[first.id] ?? first.label} öne çıkarken ${themeText[second.id] ?? second.label} da bağınızı destekliyor.`;
}

export function mergeSoulmateCandidates(current: SoulmateCandidate[], incoming: SoulmateCandidate[]) {
  const unique = new Map(current.map((candidate) => [candidate.profile.userId, candidate]));
  incoming.forEach((candidate) => unique.set(candidate.profile.userId, candidate));
  return [...unique.values()].sort((left, right) => {
    const leftScore = Number.isFinite(left.match.score) ? left.match.score : -1;
    const rightScore = Number.isFinite(right.match.score) ? right.match.score : -1;
    return rightScore - leftScore || left.profile.userId.localeCompare(right.profile.userId);
  });
}

export function shouldShowSoulmateSummary(candidateCount: number, newCount: number) {
  return candidateCount > 0 && newCount > 0;
}
