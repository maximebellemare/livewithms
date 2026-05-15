export function validateLocalizedAIRestraint(lines: string[]) {
  const invalid = lines.some((line) =>
    /\bwe know you\b|\balways here for you\b|\byou can rely on me\b|\bact now\b|\bdon't miss\b|\btrust us\b/i.test(line),
  );

  return { valid: !invalid };
}
