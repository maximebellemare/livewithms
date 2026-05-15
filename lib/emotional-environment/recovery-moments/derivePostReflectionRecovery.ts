import type { AtmosphereState, EmotionalRecoveryMoment } from "../types";

export function derivePostReflectionRecovery(atmosphere: AtmosphereState): EmotionalRecoveryMoment {
  return atmosphere === "REFLECTIVE"
    ? {
        title: "A brief pause can be enough",
        body: "You can leave this here for now.",
        spacing: "standard",
      }
    : {
        title: "You can keep the next step light",
        body: "There is no need to do more right away.",
        spacing: "roomy",
      };
}

