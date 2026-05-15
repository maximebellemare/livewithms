import { AI_TRUST_SENSITIVE_PATTERNS } from "../constants";
import type { SensitiveTopic } from "../types";

export function detectSensitiveTopics(text: string | null | undefined): SensitiveTopic[] {
  const normalized = (text ?? "").toLowerCase();
  if (!normalized) {
    return [];
  }

  const topics = AI_TRUST_SENSITIVE_PATTERNS.flatMap((rule) =>
    rule.matches.some((match) => normalized.includes(match)) ? [rule.topic as SensitiveTopic] : [],
  );

  return Array.from(new Set(topics));
}
