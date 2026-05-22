import type { AtmosphereState, EmotionalRecoveryMoment } from "../types";

export function derivePostReflectionRecovery(atmosphere: AtmosphereState): EmotionalRecoveryMoment {
  return atmosphere === "REFLECTIVE"
    ? {
        title: "A brief pause can be enough",
        body: "This can stay here for now.",
        spacing: "standard",
      }
    : {
        title: "You can keep the next step light",
        body: "Nothing else is needed right away.",
        spacing: "roomy",
      };
}
