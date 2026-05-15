import type { CognitiveBurden, DeferredContent, DisclosureDepth } from "../types";

export function deriveDeferredContent(input: {
  burden: CognitiveBurden;
  disclosureDepth: DisclosureDepth;
}): DeferredContent {
  if (input.disclosureDepth === "minimal" || input.burden === "high") {
    return {
      hideCelebrations: true,
      hideProgress: true,
      hideSecondarySupport: true,
      hideSecondaryProgram: true,
      hideWins: true,
      hideBestWorstDay: true,
    };
  }

  if (input.disclosureDepth === "standard") {
    return {
      hideCelebrations: false,
      hideProgress: false,
      hideSecondarySupport: false,
      hideSecondaryProgram: false,
      hideWins: false,
      hideBestWorstDay: true,
    };
  }

  return {
    hideCelebrations: false,
    hideProgress: false,
    hideSecondarySupport: false,
    hideSecondaryProgram: false,
    hideWins: false,
    hideBestWorstDay: false,
  };
}
