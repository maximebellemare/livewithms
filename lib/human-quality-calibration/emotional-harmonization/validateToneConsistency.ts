import type { HumanQualityValidation } from "../types";

export function validateToneConsistency(lines: string[]): HumanQualityValidation {
  const combined = lines.join(" ");
  const invalid =
    /\bhey friend\b|\bwe miss you\b|\byou only need this\b|\bgame changer\b|\bact now\b|\bpush harder\b/i.test(combined);

  return {
    valid: !invalid,
    reasons: invalid ? ["tone-inconsistency"] : [],
  };
}
