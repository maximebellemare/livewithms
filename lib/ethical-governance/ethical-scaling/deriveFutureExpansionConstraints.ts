import type { FutureExpansionConstraint } from "../types";

export function deriveFutureExpansionConstraints(features: string[]): FutureExpansionConstraint[] {
  return features.map((feature) => ({
    feature,
    requiresExplicitConsent: true,
    requiresHumanSecondaryPosition: true,
    disallowPersuasionLoops: true,
  }));
}
