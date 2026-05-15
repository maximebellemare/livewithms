export const AI_TRUST_CERTAINTY_PATTERNS = [
  /\bclearly\b/gi,
  /\bdefinitely\b/gi,
  /\bthis means\b/gi,
  /\byou are\b/gi,
  /\byou will\b/gi,
];

export const AI_TRUST_AUTHORITATIVE_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\byou should\b/gi, replacement: "it may help to" },
  { pattern: /\byou need to\b/gi, replacement: "it may help to" },
  { pattern: /\bthe best thing is to\b/gi, replacement: "one option may be to" },
  { pattern: /\bit is important to\b/gi, replacement: "it may help to" },
];

export const AI_TRUST_DEPENDENCY_PATTERNS = [
  "always here for you",
  "rely on me",
  "lean on me",
  "i understand exactly how you feel",
  "i'll always be here",
  "come back to me anytime you need",
  "you can count on me",
];

export const AI_TRUST_THERAPY_PATTERNS = [
  "hold space",
  "process your trauma",
  "inner child",
  "therapeutic",
  "trauma response",
  "nervous system is dysregulated",
  "healing journey",
];

export const AI_TRUST_MEDICAL_PATTERNS = [
  "diagnosis",
  "diagnose",
  "disease progression",
  "relapse",
  "flare",
  "lesion",
  "medication",
  "treatment",
  "clinically",
];

export const AI_TRUST_SENSITIVE_PATTERNS: Array<{ topic: string; matches: string[] }> = [
  { topic: "despair", matches: ["despair", "can't do this", "falling apart"] },
  { topic: "hopelessness", matches: ["hopeless", "nothing will help", "no point"] },
  { topic: "panic", matches: ["panic", "panicking", "can't calm down"] },
  { topic: "overwhelm", matches: ["overwhelmed", "too much", "can't cope"] },
  { topic: "shutdown", matches: ["shut down", "numb", "checked out"] },
  { topic: "crisis", matches: ["want to die", "suicide", "self-harm", "hurt myself"] },
  { topic: "medical", matches: ["diagnose", "medication", "treatment", "relapse"] },
] as const;
