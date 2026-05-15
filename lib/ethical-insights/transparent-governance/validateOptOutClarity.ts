export function validateOptOutClarity(lines: string[]) {
  const invalid = lines.some((line) =>
    /\byou must stay opted in\b|\bopting out may limit emotional support\b|\brequired for full care\b|\byou cannot disable\b/i.test(line),
  );

  return { valid: !invalid };
}
