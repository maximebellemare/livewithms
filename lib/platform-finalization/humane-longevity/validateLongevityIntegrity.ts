export function validateLongevityIntegrity(lines: string[]) {
  const invalid = lines.some((line) =>
    /\bchase trends\b|\bconstant reinvention\b|\bnovelty first\b|\bspectacle\b|\bfeature race\b/i.test(line),
  );

  return {
    valid: !invalid,
    reasons: invalid ? ["longevity-integrity-failure"] : [],
  };
}
