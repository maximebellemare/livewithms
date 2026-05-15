import { validateObservationSafety } from "../longitudinal/safety/validateObservationSafety";
import { validatePersonhoodPreservation } from "./identity-safety/validatePersonhoodPreservation";
import type { LongWindowPattern } from "./types";

export function derivePersonhoodSafePatterns(patterns: LongWindowPattern[]): LongWindowPattern[] {
  return patterns.flatMap((pattern) => {
    const personhood = validatePersonhoodPreservation(pattern.body);
    const safety = validateObservationSafety(personhood.sanitizedText);
    if (!personhood.safe || !safety.safe) {
      return [];
    }

    return [{ ...pattern, body: safety.sanitizedText }];
  });
}

