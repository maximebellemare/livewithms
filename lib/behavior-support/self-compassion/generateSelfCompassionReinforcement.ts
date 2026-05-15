import type { ContinuityState, RecoveryExperience } from "../types";

export function generateSelfCompassionReinforcement(input: {
  continuity: ContinuityState;
  recoveryExperience: RecoveryExperience;
}) {
  if (input.recoveryExperience.style === "extra-gentle") {
    return "A brief return can be enough on heavier days.";
  }

  if (input.continuity.level === "re-entering") {
    return "Returning after disruption still matters.";
  }

  if (input.continuity.level === "steady") {
    return "A steadier rhythm can still stay flexible.";
  }

  return "Small moments of support can still add up over time.";
}
