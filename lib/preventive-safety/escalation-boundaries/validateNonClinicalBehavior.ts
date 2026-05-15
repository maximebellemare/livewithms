export function validateNonClinicalBehavior(lines: string[]) {
  const invalid = lines.some((line) =>
    /\bwe detected a crisis\b|\bclinical risk\b|\bdiagnostic concern\b|\bemergency protocol\b/i.test(line),
  );

  return { valid: !invalid };
}
