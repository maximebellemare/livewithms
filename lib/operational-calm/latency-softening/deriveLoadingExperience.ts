import { deriveAILatencyState } from "./deriveAILatencyState";
import { generateCalmWaitingCopy } from "./generateCalmWaitingCopy";

export function deriveLoadingExperience(durationMs: number) {
  const state = deriveAILatencyState(durationMs);
  return {
    state,
    copy: generateCalmWaitingCopy(state),
    showSpinner: state !== "degraded",
  };
}
