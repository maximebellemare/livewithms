export function validateEvolutionEthics(lines: string[]) {
  const invalid = lines.some((line) =>
    /\bmaximize attachment\b|\bintimacy simulation\b|\bemotional dependence\b|\bbehavioral control\b|\bpersuasive escalation\b/i.test(
      line,
    ),
  );

  return {
    valid: !invalid,
    reasons: invalid ? ["evolution-ethics-violation"] : [],
  };
}
