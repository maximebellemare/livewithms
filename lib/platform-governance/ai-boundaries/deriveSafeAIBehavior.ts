import { guardEmotionalSupportCopy } from "../../emotional-support-engine";
import { preventCompanionDynamics } from "../../future-ai-governance/anti-immersion/preventCompanionDynamics";
import type { PlatformAIBehavior, PlatformGovernanceInput } from "../types";
import { deriveAllowedAdaptationLevel } from "../adaptive-governance/deriveAllowedAdaptationLevel";

export function deriveSafeAIBehavior(input: PlatformGovernanceInput): PlatformAIBehavior {
  const adaptive = deriveAllowedAdaptationLevel(input);

  return {
    maxInterpretiveSentences: adaptive.level === "protective" ? 2 : adaptive.level === "bounded" ? 3 : 4,
    avoidTherapySimulation: true,
    avoidDependencyDynamics: true,
    avoidCompanionTone: true,
    avoidEmotionalOverreach: true,
  };
}

export function applySafeAIBehavior(text: string) {
  return guardEmotionalSupportCopy(
    preventCompanionDynamics(text)
      .replace(/\bwill stay with you\b/gi, "can stay available if useful")
      .replace(/\bstay with you forever\b/gi, "remain available if useful"),
  );
}
