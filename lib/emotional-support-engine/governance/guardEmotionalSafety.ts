const UNSAFE_EMOTIONAL_SUPPORT_PATTERNS = [
  /\balways here for you\b/gi,
  /\byou only need me\b/gi,
  /\bai companion\b/gi,
  /\btherapy\b/gi,
  /\bhealing journey\b/gi,
  /\boptimi[sz]e your nervous system\b/gi,
  /\btransform your mindset\b/gi,
  /\bdiscover your purpose\b/gi,
  /\beverything will be okay\b/gi,
  /\byou are safe\b/gi,
  /\bpanic treatment\b/gi,
  /\bai emotional (?:healing|regulation|resilience)\b/gi,
];

const SAFETY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\balways here for you\b/gi, "available when it feels useful"],
  [/\byou only need me\b/gi, "real-world support still matters"],
  [/\bai companion\b/gi, "calmer support"],
  [/\btherapy\b/gi, "support"],
  [/\bhealing journey\b/gi, "slower period"],
  [/\boptimi[sz]e your nervous system\b/gi, "reduce internal pressure"],
  [/\btransform your mindset\b/gi, "keep perspective gentler"],
  [/\bdiscover your purpose\b/gi, "come back to smaller meaning"],
  [/\beverything will be okay\b/gi, "this may feel a little more manageable later"],
  [/\byou are safe\b/gi, "you may not need to interpret everything immediately"],
  [/\bpanic treatment\b/gi, "calmer grounding"],
  [/\bai emotional (?:healing|regulation|resilience)\b/gi, "calmer grounding"],
];

export function containsUnsafeEmotionalSupportLanguage(text: string) {
  return UNSAFE_EMOTIONAL_SUPPORT_PATTERNS.some((pattern) => pattern.test(text));
}

export function guardEmotionalSupportCopy(text: string) {
  let next = text.replace(/\s+/g, " ").trim();

  for (const [pattern, replacement] of SAFETY_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.replace(/\s{2,}/g, " ").trim();
}
