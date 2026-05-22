import { derivePlatformGovernance } from "../../platform-governance";
import type { PlatformCoreInput } from "../types";

export function derivePlatformAIBehavior(input: PlatformCoreInput) {
  const governance = derivePlatformGovernance(input);

  return {
    ...governance.ai,
    avoidPsychologicalProfiling: true,
    avoidEmotionalStickiness: true,
  };
}
