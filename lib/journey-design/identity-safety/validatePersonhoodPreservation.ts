import type { PersonhoodValidation } from "../types";
import { preventIllnessIdentityReinforcement } from "./preventIllnessIdentityReinforcement";
import { softenNarrativeFraming } from "../narrative-softening/softenNarrativeFraming";

const BLOCKED_PATTERNS = [
  /\bhero\b/i,
  /\bwarrior\b/i,
  /\bhealing journey\b/i,
  /\bmade you stronger\b/i,
  /\bdefines you\b/i,
];

export function validatePersonhoodPreservation(text: string): PersonhoodValidation {
  const sanitizedText = preventIllnessIdentityReinforcement(softenNarrativeFraming(text));
  const reasons = BLOCKED_PATTERNS.filter((pattern) => pattern.test(text)).map((pattern) => pattern.source);

  return {
    safe: reasons.length === 0,
    reasons,
    sanitizedText,
  };
}

