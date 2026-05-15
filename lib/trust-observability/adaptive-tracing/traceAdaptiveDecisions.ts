import type { AdaptiveTrace } from "../types";
import { deriveAdaptationReasons } from "./deriveAdaptationReasons";

export function traceAdaptiveDecisions(input: {
  system: string;
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";
  burden: "low" | "moderate" | "high";
  decision: string;
  hasAiVisible?: boolean;
  stackedSurfaces?: number;
}): AdaptiveTrace[] {
  return deriveAdaptationReasons(input).map((reason) => ({
    system: input.system,
    decision: input.decision,
    reason,
    impact:
      reason === "ai-presence-coordination"
        ? "reduce-ai-presence"
        : reason === "emotional-safety-priority"
          ? "preserve-calm"
          : reason === "surface-density-reduction"
            ? "reduce-load"
            : "preserve-autonomy",
  }));
}
