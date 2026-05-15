import type { RelationalBoundaryRisk } from "../types";

export function reduceAIOverpresence(input: {
  risk: RelationalBoundaryRisk;
  requestedSentenceLimit: number;
  aiVisible: boolean;
}) {
  if (!input.aiVisible) {
    return {
      maxSentenceLimit: input.requestedSentenceLimit,
      suppressExtraWarmth: false,
      preferShortClosure: false,
    };
  }

  if (input.risk === "elevated") {
    return {
      maxSentenceLimit: Math.min(input.requestedSentenceLimit, 2),
      suppressExtraWarmth: true,
      preferShortClosure: true,
    };
  }

  if (input.risk === "guarded") {
    return {
      maxSentenceLimit: Math.min(input.requestedSentenceLimit, 3),
      suppressExtraWarmth: true,
      preferShortClosure: false,
    };
  }

  return {
    maxSentenceLimit: input.requestedSentenceLimit,
    suppressExtraWarmth: false,
    preferShortClosure: false,
  };
}
