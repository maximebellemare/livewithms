export function validateAIBoundarySafety(text: string) {
  const invalidPatterns = [
    /\bi'm always here for you\b/i,
    /\byou can rely on me\b/i,
    /\bi understand you better than anyone\b/i,
    /\byou need to keep coming back\b/i,
  ];

  const valid = !invalidPatterns.some((pattern) => pattern.test(text));

  return {
    valid,
    reasons: valid ? [] : ["relational-overreach"],
  };
}
