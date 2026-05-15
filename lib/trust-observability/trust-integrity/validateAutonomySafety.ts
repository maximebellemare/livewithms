import type { TrustIntegrityResult } from "../types";

export function validateAutonomySafety(text: string): TrustIntegrityResult {
  const reasons = [
    /\byou need this\b/i.test(text) ? "need-framing" : null,
    /\byou should rely on\b/i.test(text) ? "reliance-framing" : null,
    /\bthe system knows\b/i.test(text) ? "system-superiority" : null,
  ].filter(Boolean) as string[];

  return {
    valid: reasons.length === 0,
    reasons,
  };
}
