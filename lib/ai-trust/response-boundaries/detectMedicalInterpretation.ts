import { AI_TRUST_MEDICAL_PATTERNS } from "../constants";

export function detectMedicalInterpretation(text: string) {
  const normalized = text.toLowerCase();
  return AI_TRUST_MEDICAL_PATTERNS.some((pattern) => normalized.includes(pattern));
}
