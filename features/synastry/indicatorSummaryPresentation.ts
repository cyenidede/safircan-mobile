const USER_FACING_ASPECT_LABELS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\b(conjunction|kavuşum)\b/gi, 'güçlü birleşim'],
  [/\b(trine|üçgen)\b/gi, 'güçlü uyum'],
  [/\b(sextile|sekstil|altmışlık)\b/gi, 'destekleyici uyum'],
  [/\b(square|kare)\b/gi, 'zorlayıcı temas'],
  [/\b(opposition|karşıtlık)\b/gi, 'zorlayıcı karşıtlık'],
];

export function formatSynastryIndicatorSummary(summary: string): string {
  const formatted = USER_FACING_ASPECT_LABELS.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    summary,
  );

  return formatted.replace(/zorlayıcı\s+zorlayıcı karşıtlık/gi, 'zorlayıcı karşıtlık');
}
