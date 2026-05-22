import { sanitizeInsightSafety } from "../../../features/insights/actionable";

const CONTINUITY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bjourney\b/gi, "longer view"],
  [/\btransformation\b/gi, "change over time"],
  [/\bhealing arc\b/gi, "longer stretch"],
  [/\blook how far you['’]ve come\b/gi, "some context is becoming easier to notice"],
  [/\bwarrior\b/gi, "person"],
  [/\bcomeback\b/gi, "return"],
  [/\bfully healed\b/gi, "steadier for now"],
  [/\binspiring\b/gi, "meaningful"],
  [/\bdiscover your purpose\b/gi, "come back to smaller meaning"],
  [/\bai companion\b/gi, "calmer support"],
  [/\btherapy\b/gi, "support"],
];

function normalizeWhitespace(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

export function guardContinuityCalmness(text: string) {
  let next = sanitizeInsightSafety(normalizeWhitespace(text));

  for (const [pattern, replacement] of CONTINUITY_REPLACEMENTS) {
    next = next.replace(pattern, replacement);
  }

  return next.replace(/\s{2,}/g, " ").trim();
}
