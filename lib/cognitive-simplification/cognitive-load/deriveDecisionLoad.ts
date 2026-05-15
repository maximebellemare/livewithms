import type { DecisionLoad } from "../types";

export function deriveDecisionLoad(input: {
  actionCount: number;
  optionCount: number;
  hasSecondaryChoices: boolean;
}): DecisionLoad {
  const total = input.actionCount + input.optionCount + (input.hasSecondaryChoices ? 2 : 0);

  if (total >= 10) {
    return "high";
  }

  if (total >= 6) {
    return "medium";
  }

  return "low";
}
