export function detectEmotionalSharpness(text: string) {
  const reasons = [
    /\burgent\b|\bimmediately\b|\bright now\b/i.test(text) ? "urgency-spike" : null,
    /\bfalling apart\b|\bbroken\b|\bcatastrophic\b/i.test(text) ? "catastrophic-framing" : null,
    /\bdon't lose momentum\b|\bpush harder\b|\bmust\b/i.test(text) ? "pressure-pocket" : null,
  ].filter((item): item is string => Boolean(item));

  return {
    sharp: reasons.length > 0,
    reasons,
  };
}
