import type { HumanQualityValidation } from "../types";

export function validateCalmnessConsistency(lines: string[]): HumanQualityValidation {
  const combined = lines.join(" ");
  const invalid =
    /\bact now\b|\burgent\b|\bdon't lose momentum\b|\bpush harder\b|\bdon't miss\b|\bimmediately\b/i.test(combined);

  return {
    valid: !invalid,
    reasons: invalid ? ["calmness-inconsistency"] : [],
  };
}
