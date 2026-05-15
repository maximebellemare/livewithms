export function validateStewardshipIntegrity(lines: string[]) {
  const invalid = lines.some((line) =>
    /\bgrowth at all costs\b|\bmaximize attachment\b|\boptimize dependency\b|\buse distress for retention\b/i.test(line),
  );

  return {
    valid: !invalid,
    reasons: invalid ? ["stewardship-integrity-failure"] : [],
  };
}
