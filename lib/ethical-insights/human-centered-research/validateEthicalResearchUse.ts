export function validateEthicalResearchUse(lines: string[]) {
  const invalid = lines.some((line) =>
    /\bad targeting\b|\bmonetize\b|\bwithout consent\b|\bnon-consensual\b|\bpsychological classification\b|\bvulnerability scoring\b/i.test(line),
  );

  return { valid: !invalid };
}
