import { detectEmotionalOverload } from "../../ai-trust/emotional-safety/detectEmotionalOverload";
import type { ConnectionFatigueState } from "../types";

export function deriveConnectionFatigueState(input: {
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";
  hasStackedEmotionalSurfaces: boolean;
  aiSummaryVisible: boolean;
  notePreview?: string | null;
}): ConnectionFatigueState {
  if (
    input.adaptiveStatePrimary === "OVERWHELMED" ||
    input.adaptiveStatePrimary === "WITHDRAWN" ||
    (input.notePreview && detectEmotionalOverload(input.notePreview))
  ) {
    return "suppressed";
  }

  if (input.adaptiveStatePrimary === "LOW_ENERGY" || (input.hasStackedEmotionalSurfaces && input.aiSummaryVisible)) {
    return "softened";
  }

  return "open";
}

