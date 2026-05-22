const DRIFT_PATTERNS = [
  /\bai-powered\b/gi,
  /\badvanced analytics\b/gi,
  /\bmental health transformation\b/gi,
  /\bbiohack(?:ing)?\b/gi,
  /\bproductivity recovery\b/gi,
  /\bai companion\b/gi,
  /\blife coaching\b/gi,
  /\btrack everything\b/gi,
  /\boptimi[sz]e\b/gi,
];

const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bai-powered\b/gi, "calmer, bounded"],
  [/\badvanced analytics\b/gi, "gentler longer-view reflection"],
  [/\bmental health transformation\b/gi, "emotionally safe support"],
  [/\bbiohack(?:ing)?\b/gi, "steady support"],
  [/\bproductivity recovery\b/gi, "lower-pressure recovery support"],
  [/\bai companion\b/gi, "support tool"],
  [/\blife coaching\b/gi, "calmer reflection support"],
  [/\btrack everything\b/gi, "track only what feels useful"],
  [/\boptimi[sz]e\b/gi, "support"],
];

export function detectCategoryDrift(text: string) {
  const reasons = DRIFT_PATTERNS.filter((pattern) => new RegExp(pattern.source, pattern.flags).test(text)).map(
    (pattern) => pattern.source,
  );

  return {
    drifted: reasons.length > 0,
    reasons,
  };
}

export function preventCategoryDrift(text: string) {
  let next = text;

  for (const [pattern, replacement] of REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.replace(/\s{2,}/g, " ").trim();
}
