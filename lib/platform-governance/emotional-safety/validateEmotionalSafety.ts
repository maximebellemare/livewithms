import { containsUnsafeEmotionalSupportLanguage, guardEmotionalSupportCopy } from "../../emotional-support-engine";
import { detectEngagementPressure } from "../../ethical-governance/manipulation-resistance/detectEngagementPressure";
import { validateEmotionalBoundaries } from "../../future-ai-governance/capability-restraints/validateEmotionalBoundaries";
import { validateNonClinicalBehavior } from "../../preventive-safety/escalation-boundaries/validateNonClinicalBehavior";
import type { PlatformGovernanceInput, PlatformEmotionalSafety } from "../types";

export function validateEmotionalSafety(input: PlatformGovernanceInput): PlatformEmotionalSafety {
  const rawLines = input.lines ?? [];
  const rawMessage = input.message ?? "";
  const combined = [rawMessage, ...rawLines].filter(Boolean).join(" ");
  const normalizedLines = rawLines.map((line) => guardEmotionalSupportCopy(line));
  const normalizedMessage = guardEmotionalSupportCopy(rawMessage);
  const normalizedCombined = [normalizedMessage, ...normalizedLines].filter(Boolean).join(" ");
  const engagement = detectEngagementPressure(combined);
  const boundary = validateEmotionalBoundaries(combined);
  const clinical = validateNonClinicalBehavior([combined]);
  const unsafeLanguage = containsUnsafeEmotionalSupportLanguage(combined);
  const platformBoundaryViolation =
    !boundary.valid || /\bai companion\b|\bstay with you forever\b|\byou have me\b/i.test(combined);
  const reasons = [
    ...(unsafeLanguage ? ["unsafe-language"] : []),
    ...(engagement.risk !== "low" ? engagement.reasons : []),
    ...(platformBoundaryViolation ? boundary.reasons.concat("platform-boundary-violation") : []),
    ...(!clinical.valid ? ["clinical-drift"] : []),
  ];

  return {
    valid: reasons.length === 0,
    containsUnsafeLanguage: unsafeLanguage,
    containsEngagementPressure: engagement.risk !== "low",
    containsBoundaryViolation: platformBoundaryViolation,
    containsClinicalDrift: !clinical.valid,
    reasons: Array.from(new Set(reasons.concat(normalizedCombined !== combined ? ["sanitized-output"] : []))),
  };
}
