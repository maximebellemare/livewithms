import type { GuidedProgramAdaptiveState } from "../types";

export function derivePauseResumeState(input: {
  adaptiveStatePrimary: GuidedProgramAdaptiveState;
  hasActiveTool: boolean;
  hasRecentTool: boolean;
}) {
  return {
    shouldOfferPause: input.hasActiveTool,
    shouldOfferResume: input.hasActiveTool || input.hasRecentTool,
    shorterResumeCopy:
      input.adaptiveStatePrimary === "LOW_ENERGY" ||
      input.adaptiveStatePrimary === "OVERWHELMED" ||
      input.adaptiveStatePrimary === "WITHDRAWN",
  };
}
