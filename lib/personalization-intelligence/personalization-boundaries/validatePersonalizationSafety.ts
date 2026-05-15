export function validatePersonalizationSafety(lines: string[]) {
  const invalid = lines.some((line) =>
    /\bwe know you\b|\byou always\b|\byou are the kind of person\b|\bexactly what you need\b/i.test(line),
  );

  return { valid: !invalid };
}
