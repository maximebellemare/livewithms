export function validateCrossPlatformTone(lines: string[]) {
  const invalid = lines.some((line) => /\burgent|don’t miss|keep up everywhere/i.test(line));
  return { valid: !invalid };
}
