import type { ExpansionCompatibility } from "../types";

export function deriveExpansionCompatibility(input: {
  featureName: string;
  adaptiveTouchpoints: number;
  hasConsentBoundary: boolean;
  hasHumanSecondaryPosition: boolean;
}) : ExpansionCompatibility {
  const reasons: string[] = [];

  if (input.adaptiveTouchpoints > 3) {
    reasons.push("too-many-adaptive-touchpoints");
  }

  if (!input.hasConsentBoundary) {
    reasons.push("missing-consent-boundary");
  }

  if (!input.hasHumanSecondaryPosition) {
    reasons.push("missing-human-secondary-position");
  }

  return {
    compatible: reasons.length === 0,
    reasons,
  };
}
