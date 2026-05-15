import type { DisclosureDepth, OptionalExpansion } from "../types";

export function deriveOptionalExpansion(depth: DisclosureDepth): OptionalExpansion {
  if (depth === "minimal") {
    return {
      showProgress: false,
      showBestWorstDay: false,
      showSecondaryProgram: false,
      showSecondarySupport: false,
      showCelebrations: false,
    };
  }

  if (depth === "expanded") {
    return {
      showProgress: true,
      showBestWorstDay: true,
      showSecondaryProgram: true,
      showSecondarySupport: true,
      showCelebrations: true,
    };
  }

  return {
    showProgress: true,
    showBestWorstDay: false,
    showSecondaryProgram: true,
    showSecondarySupport: true,
    showCelebrations: true,
  };
}
