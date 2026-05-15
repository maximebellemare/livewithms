export const LONGITUDINAL_DEFAULTS = {
  weeklyDays: 7,
  monthlyDays: 30,
  annualDays: 365,
  minimumEntriesForObservations: 3,
  elevatedFatigue: 3.8,
  elevatedStress: 3.8,
  elevatedBrainFog: 3.5,
  lowMood: 2.2,
  lowSleep: 6.3,
  lowHydration: 5,
  moderateCorrelationGap: 0.6,
} as const;

export const LONGITUDINAL_BLOCKED_PATTERNS = [
  "getting worse",
  "worsening",
  "declining",
  "disease progression",
  "progression",
  "clinically significant",
  "you should be concerned",
  "failed to maintain consistency",
  "you need to",
  "we detected",
  "likely have",
  "must",
] as const;

export const LONGITUDINAL_SOFT_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bwe detected\b/gi, replacement: "some recent entries suggest" },
  { pattern: /\byou need to\b/gi, replacement: "it may help to" },
  { pattern: /\bmust\b/gi, replacement: "may" },
  { pattern: /\bdeclining\b/gi, replacement: "feeling heavier lately" },
  { pattern: /\bgetting worse\b/gi, replacement: "feeling more difficult lately" },
  { pattern: /\bworsening\b/gi, replacement: "feeling more difficult" },
  { pattern: /\bclinically significant\b/gi, replacement: "notable in your recent entries" },
];

export const REFLECTION_THEME_KEYWORDS: Array<{ label: string; matches: string[] }> = [
  { label: "stress", matches: ["stress", "pressure", "tense", "overwhelm", "overwhelmed"] },
  { label: "fatigue", matches: ["fatigue", "tired", "exhausted", "drained", "low energy"] },
  { label: "brain fog", matches: ["brain fog", "foggy", "fuzzy", "unclear", "hard to think"] },
  { label: "sleep", matches: ["sleep", "rest", "awake", "insomnia", "bedtime"] },
  { label: "support", matches: ["helped", "support", "kind", "steady", "gentle"] },
  { label: "planning", matches: ["plan", "priority", "organize", "simplify", "list"] },
];
