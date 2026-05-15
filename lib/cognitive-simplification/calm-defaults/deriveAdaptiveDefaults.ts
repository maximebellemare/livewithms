import type { AdaptiveDefaults, CognitiveBurden, DisclosureDepth } from "../types";
import { deriveSafeDefaults } from "./deriveSafeDefaults";

export function deriveAdaptiveDefaults(input: {
  burden: CognitiveBurden;
  disclosureDepth: DisclosureDepth;
}): AdaptiveDefaults {
  const base = deriveSafeDefaults();

  if (input.disclosureDepth === "minimal" || input.burden === "high") {
    return {
      ...base,
      noteStarterCount: 1,
      quickLinkCount: 2,
      useCondensedSpacing: true,
    };
  }

  if (input.disclosureDepth === "expanded") {
    return {
      ...base,
      noteStarterCount: 3,
      quickLinkCount: 4,
      useCondensedSpacing: false,
    };
  }

  return {
    ...base,
    useCondensedSpacing: false,
  };
}
