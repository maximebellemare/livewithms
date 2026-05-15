export function validateOwnershipTransparency(lines: string[]) {
  const invalid = lines.some((line) =>
    /\bour data\b|\byou will lose everything\b|\bmust stay subscribed\b|\baccess may be revoked without notice\b/i.test(line),
  );

  return { valid: !invalid };
}
