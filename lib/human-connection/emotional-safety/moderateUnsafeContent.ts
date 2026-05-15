import type { ModerationResult } from "../types";
import { detectCatastrophizing } from "./detectCatastrophizing";
import { detectEmotionalContagion } from "./detectEmotionalContagion";

const SOFTENERS: Array<[RegExp, string]> = [
  [/\byou are not alone in this battle\b/gi, "You are not alone in this kind of stretch"],
  [/\bshare your battle\b/gi, "share only what feels safe"],
  [/\bwarrior community\b/gi, "shared reflections"],
];

export function moderateUnsafeContent(text: string): ModerationResult {
  let sanitizedText = text;
  for (const [pattern, replacement] of SOFTENERS) {
    sanitizedText = sanitizedText.replace(pattern, replacement);
  }

  const reasons: string[] = [];
  if (detectCatastrophizing(sanitizedText)) {
    reasons.push("catastrophizing");
  }
  if (detectEmotionalContagion(sanitizedText)) {
    reasons.push("emotional-contagion");
  }
  if (/\blike\b|\breplies\b|\bfollow\b|\btop contributors\b/i.test(sanitizedText)) {
    reasons.push("engagement-dynamics");
  }

  return {
    safe: reasons.length === 0,
    sanitizedText,
    reasons,
  };
}

