import { LONGITUDINAL_BLOCKED_PATTERNS } from "../constants";
import { sanitizeMedicalLanguage } from "./sanitizeMedicalLanguage";

export type ObservationSafetyResult = {
  safe: boolean;
  sanitizedText: string;
  reasons: string[];
};

export function validateObservationSafety(text: string): ObservationSafetyResult {
  const sanitizedText = sanitizeMedicalLanguage(text);
  const normalized = sanitizedText.toLowerCase();
  const reasons = LONGITUDINAL_BLOCKED_PATTERNS.filter((pattern) => normalized.includes(pattern));

  return {
    safe: reasons.length === 0,
    sanitizedText,
    reasons,
  };
}
