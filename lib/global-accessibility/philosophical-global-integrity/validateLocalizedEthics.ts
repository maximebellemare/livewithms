export function validateLocalizedEthics(lines: string[]) {
  const invalid = lines.some((line) =>
    /\bmust\b.*\bupgrade\b|\bworsening\b|\bshould worry\b|\bfollow instructions\b|\bcompliance\b|\bdecline\b/i.test(line),
  );

  return { valid: !invalid };
}
