import type { AdaptiveDensityProfile, AdaptiveFlow } from "../types";

export function deriveContentReduction(density: AdaptiveDensityProfile): AdaptiveFlow["contentReduction"] {
  if (density === "MINIMAL") {
    return {
      maxHomeCards: 5,
      hideSecondaryWins: true,
      shortenSupportCopy: true,
      reduceOptionalPrompts: true,
    };
  }

  if (density === "REFLECTIVE") {
    return {
      maxHomeCards: 8,
      hideSecondaryWins: false,
      shortenSupportCopy: false,
      reduceOptionalPrompts: false,
    };
  }

  return {
    maxHomeCards: 7,
    hideSecondaryWins: false,
    shortenSupportCopy: false,
    reduceOptionalPrompts: false,
  };
}
