export function validateEmotionalBoundaries(text: string) {
  const invalid = /\bmeant to be with you\b|\byour companion\b|\bsoulmate\b|\bi(?:'| wi)ll stay with you forever\b|\bcloser than anyone\b/i.test(
    text,
  );

  return {
    valid: !invalid,
    reasons: invalid ? ["emotional-boundary-violation"] : [],
  };
}
