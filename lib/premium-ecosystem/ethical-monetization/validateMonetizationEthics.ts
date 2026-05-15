export function validateMonetizationEthics(lines: string[]) {
  const invalid = lines.some((line) =>
    /\bupgrade for recovery\b|\bunlock emotional support\b|\bpay to feel safe\b|\bcrisis\b/i.test(line),
  );

  return { valid: !invalid };
}
