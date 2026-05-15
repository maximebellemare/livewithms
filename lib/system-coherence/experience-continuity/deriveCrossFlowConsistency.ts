import type { CoherenceTone } from "../types";

export function deriveCrossFlowConsistency(input: {
  entryTone: CoherenceTone;
  destinationTone: CoherenceTone;
}) {
  const consistent = input.entryTone === input.destinationTone || input.entryTone === "quiet";

  return {
    consistent,
    preferQuietBridge: !consistent,
  };
}
