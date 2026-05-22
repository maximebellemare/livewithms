import type { AdaptiveExperienceState } from "../../adaptive-intelligence";
import type { CalmProgramFlow, ProgramsEcosystemInput } from "../types";

export function deriveCalmProgramFlow(
  adaptive: AdaptiveExperienceState,
  input: ProgramsEcosystemInput,
): CalmProgramFlow {
  return {
    simplifyFurther: adaptive.programs.simplifyFurther,
    interruptionSafe: true,
    avoidCompletionPressure: true,
    supportsGentleResume: Boolean(input.lastOpenedToolId || input.recentToolIds?.length),
    lowerEmotionalDensity: adaptive.calmness.lowerEmotionalIntensity || adaptive.reducedComplexity.simplifyPrograms,
  };
}
