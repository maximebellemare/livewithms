import type { HiddenComplexity } from "../types";
import { deriveDeferredContent } from "../surface-prioritization/deriveDeferredContent";

export function deriveHiddenComplexity(input: {
  burden: "low" | "medium" | "high";
  disclosureDepth: "minimal" | "standard" | "expanded";
}): HiddenComplexity {
  return deriveDeferredContent(input);
}
