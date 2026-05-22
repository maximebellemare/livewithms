import { deriveReducedCognitiveLoad } from "../../emotional-support-engine";
import type { AdaptiveIntelligenceInput } from "../types";
import { deriveInteractionTolerance } from "../context/deriveInteractionTolerance";

export function deriveCognitiveLoadLevel(input: AdaptiveIntelligenceInput) {
  return deriveReducedCognitiveLoad({
    ...input,
    interactionTolerance: deriveInteractionTolerance(input),
  });
}
