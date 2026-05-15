import { AI_TRUST_THERAPY_PATTERNS } from "../constants";

export function detectTherapyLikeResponses(text: string) {
  const normalized = text.toLowerCase();
  return AI_TRUST_THERAPY_PATTERNS.some((pattern) => normalized.includes(pattern));
}
