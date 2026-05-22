import { deriveCalmnessLevel, guardEmotionalSupportCopy } from "../../emotional-support-engine";
import type { AdaptiveIntelligenceInput } from "../types";
import { deriveInteractionTolerance } from "../context/deriveInteractionTolerance";

export function deriveCalmnessPresentation(input: AdaptiveIntelligenceInput) {
  const calmness = deriveCalmnessLevel({
    ...input,
    interactionTolerance: deriveInteractionTolerance(input),
  });

  return {
    ...calmness,
    title:
      calmness.level === "protective"
        ? "Protective calmness"
        : calmness.level === "heightened"
          ? "Heightened calmness"
          : "Standard calmness",
    body:
      calmness.level === "protective"
        ? guardEmotionalSupportCopy("The app can reduce overload more actively when the day feels harder to hold.")
        : calmness.level === "heightened"
          ? guardEmotionalSupportCopy("The app can soften visual and emotional sharpness during heavier stretches.")
          : guardEmotionalSupportCopy("The app can stay calm and spacious without overreacting."),
  };
}
