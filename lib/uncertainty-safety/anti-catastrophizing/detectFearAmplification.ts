export function detectFearAmplification(text: string) {
  return /\bshould be concerned\b|\bprogression\b|\bdeterioration\b|\bdecline\b|\bworsened significantly\b/i.test(text);
}

