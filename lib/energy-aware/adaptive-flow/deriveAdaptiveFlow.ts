import { detectAbandonedFlows } from "../friction-detection/detectAbandonedFlows";
import { detectInteractionFatigue } from "../friction-detection/detectInteractionFatigue";
import { detectRapidExitPatterns } from "../friction-detection/detectRapidExitPatterns";
import { deriveInteractionComplexity } from "./deriveInteractionComplexity";
import { deriveUIDensity } from "../ui-density/deriveUIDensity";
import { deriveContentReduction } from "../ui-density/deriveContentReduction";
import { deriveCompressedCheckin } from "../session-compression/deriveCompressedCheckin";
import { deriveReducedReflectionFlow } from "../session-compression/deriveReducedReflectionFlow";
import { deriveNotificationCadence } from "../notification-softening/deriveNotificationCadence";
import { deriveNotificationTone } from "../notification-softening/deriveNotificationTone";
import { deriveReturnExperience } from "../return-flow/deriveReturnExperience";
import type { AdaptiveFlow, AdaptiveFlowInput } from "../types";

/**
 * Central energy-aware coordinator. Its only job is to lower burden and
 * soften pacing when recent signals suggest the user may have less capacity.
 */
export function deriveAdaptiveFlow(input: AdaptiveFlowInput): AdaptiveFlow {
  const density = deriveUIDensity(input);
  const complexity = deriveInteractionComplexity(input);
  const frictionSignals = {
    interactionFatigue: detectInteractionFatigue(input),
    rapidExitPattern: detectRapidExitPatterns(input),
    abandonedFlows: detectAbandonedFlows(input),
  };
  const motionIntensity = density === "MINIMAL" ? "REDUCED" : "STANDARD";

  return {
    state: input.adaptiveState.primary,
    density,
    complexity,
    motionIntensity,
    contentReduction: deriveContentReduction(density),
    compressedCheckIn: deriveCompressedCheckin(input),
    reducedReflectionFlow: deriveReducedReflectionFlow(input),
    notification: {
      cadence: deriveNotificationCadence(input),
      tone: deriveNotificationTone(input),
    },
    returnExperience: deriveReturnExperience(input),
    frictionSignals,
  };
}
