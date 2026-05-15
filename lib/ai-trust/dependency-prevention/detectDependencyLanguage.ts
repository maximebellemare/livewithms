import { AI_TRUST_DEPENDENCY_PATTERNS } from "../constants";

export function detectDependencyLanguage(text: string) {
  const normalized = text.toLowerCase();
  return AI_TRUST_DEPENDENCY_PATTERNS.some((pattern) => normalized.includes(pattern));
}
