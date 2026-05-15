export function validateCrossSystemCalmness(lines: string[]) {
  const invalid = lines.some((line) =>
    /\bright now\b.*\bright now\b|\bdo this\b.*\bdo that\b|\bact now\b|\bdon't miss\b|\beverything at once\b/i.test(line),
  );

  return { valid: !invalid };
}
