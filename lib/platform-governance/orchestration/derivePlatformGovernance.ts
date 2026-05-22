import { deriveAccessibilityGovernance } from "../accessibility/deriveAccessibilityGovernance";
import { deriveAllowedAdaptationLevel } from "../adaptive-governance/deriveAllowedAdaptationLevel";
import { deriveSafeAIBehavior } from "../ai-boundaries/deriveSafeAIBehavior";
import { deriveCalmnessConstraints } from "../calmness-governance/deriveCalmnessConstraints";
import { validateEmotionalSafety } from "../emotional-safety/validateEmotionalSafety";
import { deriveOperationalGovernance } from "../operational-governance/deriveOperationalGovernance";
import type { PlatformGovernanceInput, PlatformGovernanceState } from "../types";

export function derivePlatformGovernance(input: PlatformGovernanceInput): PlatformGovernanceState {
  return {
    emotionalSafety: validateEmotionalSafety(input),
    adaptive: deriveAllowedAdaptationLevel(input),
    calmness: deriveCalmnessConstraints(input),
    ai: deriveSafeAIBehavior(input),
    operational: deriveOperationalGovernance(input),
    accessibility: deriveAccessibilityGovernance(input),
  };
}
