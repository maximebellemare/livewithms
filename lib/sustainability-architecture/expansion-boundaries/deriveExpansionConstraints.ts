import type { ExpansionConstraint } from "../types";

export function deriveExpansionConstraints(zones: string[]): ExpansionConstraint[] {
  return zones.map((zone) => ({
    zone,
    maxAdaptiveTouchpoints: zone === "ai-surface" ? 3 : 2,
    requiresPhilosophyValidation: true,
    requiresConsentBoundary: zone === "wearable" || zone === "voice" || zone === "social",
  }));
}
