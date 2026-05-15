import type { SurfacePriority, SurfacePriorityInput } from "../types";

export function derivePrimarySurface(input: SurfacePriorityInput): SurfacePriority {
  if (!input.hasTodayEntry) {
    return input.lifecycleStage === "returning" ? "re-entry" : "check-in";
  }

  if (input.adaptiveStatePrimary === "LOW_ENERGY" || input.adaptiveStatePrimary === "OVERWHELMED") {
    return "guidance";
  }

  if (input.hasReflectionCards && input.adaptiveStatePrimary === "REFLECTIVE") {
    return "reflection";
  }

  if (input.hasAiSummary) {
    return "insights";
  }

  return "guidance";
}
