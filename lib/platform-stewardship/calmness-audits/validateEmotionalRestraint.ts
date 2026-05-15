export function validateEmotionalRestraint(text: string) {
  const invalid = /\bintense connection\b|\bemotionally immersive\b|\bconstant engagement\b|\bpressure to return\b/i.test(
    text,
  );

  return {
    valid: !invalid,
    reasons: invalid ? ["emotional-restraint-failure"] : [],
  };
}
