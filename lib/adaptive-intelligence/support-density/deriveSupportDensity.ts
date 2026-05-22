import { deriveSupportDensity as deriveEmotionalSupportDensity } from "../../emotional-support-engine";
import type { AdaptiveIntelligenceInput } from "../types";
import { deriveInteractionTolerance } from "../context/deriveInteractionTolerance";

export function deriveSupportDensity(input: AdaptiveIntelligenceInput) {
  return deriveEmotionalSupportDensity({
    ...input,
    interactionTolerance: deriveInteractionTolerance(input),
  });
}
