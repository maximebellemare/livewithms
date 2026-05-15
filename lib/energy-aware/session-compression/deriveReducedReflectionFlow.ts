import type { AdaptiveFlow, AdaptiveFlowInput } from "../types";

export function deriveReducedReflectionFlow(input: AdaptiveFlowInput): AdaptiveFlow["reducedReflectionFlow"] {
  if (input.adaptiveState.primary === "REFLECTIVE") {
    return {
      shortenPrompts: false,
      limitPromptCount: 3,
      preferContinuity: false,
    };
  }

  if (input.adaptiveState.primary === "LOW_ENERGY" || input.adaptiveState.primary === "OVERWHELMED") {
    return {
      shortenPrompts: true,
      limitPromptCount: 1,
      preferContinuity: true,
    };
  }

  if (input.adaptiveState.primary === "WITHDRAWN") {
    return {
      shortenPrompts: true,
      limitPromptCount: 1,
      preferContinuity: true,
    };
  }

  return {
    shortenPrompts: true,
    limitPromptCount: 2,
    preferContinuity: false,
  };
}
