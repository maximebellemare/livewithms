import type { IntentRecord } from "../types";

export function generateIntentAnnotations(intents: IntentRecord[]) {
  return intents.map(
    (intent) =>
      `${intent.system}: ${intent.purpose}; rationale: ${intent.emotionalRationale}; constraints: ${intent.constraints.join(", ")}`,
  );
}
