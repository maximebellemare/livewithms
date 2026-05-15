import type { ExplainabilityNote } from "../types";

export function deriveSystemReasoning(input: {
  system: string;
  priority: string;
  limits: string[];
}): ExplainabilityNote {
  return {
    title: `${input.system} reasoning`,
    body: `${input.system} prioritized ${input.priority} while respecting ${input.limits.join(", ")}.`,
  };
}
