export function validateEducationalSafety(text: string) {
  const invalidPatterns = [
    /\bsigns your ms is worsening\b/i,
    /\bsymptoms you should worry about\b/i,
    /\bmiracle\b/i,
    /\bfight harder\b/i,
    /\bdoom\b/i,
  ];

  return {
    valid: !invalidPatterns.some((pattern) => pattern.test(text)),
  };
}
