export function detectEmotionalContagion(text: string) {
  const intenseSignals = (text.match(/\bpanic\b|\bterrifying\b|\bhopeless\b|\bspiraling\b|\bdoom\b/gi) ?? []).length;
  return intenseSignals >= 2;
}

