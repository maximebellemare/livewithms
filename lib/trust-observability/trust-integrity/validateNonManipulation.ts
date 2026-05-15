import type { TrustIntegrityResult } from "../types";

export function validateNonManipulation(text: string): TrustIntegrityResult {
  const reasons = [
    /\bwe miss you\b/i.test(text) ? "emotional-hooking" : null,
    /\bdon't lose momentum\b/i.test(text) ? "momentum-pressure" : null,
    /\bcome back tomorrow\b/i.test(text) ? "return-pressure" : null,
  ].filter(Boolean) as string[];

  return {
    valid: reasons.length === 0,
    reasons,
  };
}
