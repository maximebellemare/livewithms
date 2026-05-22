import { derivePlatformGovernance } from "../../platform-governance";
import type { PlatformAccessibilityRules, PlatformCoreInput } from "../types";

export function derivePlatformAccessibilityRules(input: PlatformCoreInput): PlatformAccessibilityRules {
  const governance = derivePlatformGovernance(input);

  return {
    fatigueReadable: governance.accessibility.fatigueReadable,
    lowSensoryLoad: governance.accessibility.lowSensoryLoad,
    interruptionSafe: governance.accessibility.interruptionSafe,
    reducedMotionPreferred: governance.accessibility.reducedMotionPreferred,
    largeTapTargetsPreferred: true,
  };
}
