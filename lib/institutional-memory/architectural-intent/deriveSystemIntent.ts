import type { IntentRecord } from "../types";

export function deriveSystemIntent(input: {
  system: string;
  activeSystems: string[];
}) : IntentRecord {
  const purpose =
    input.system === "meta-orchestration"
      ? "coordinate adaptive systems without letting calmness or philosophy fragment"
      : "preserve calmness and product reasoning as the system evolves";

  return {
    system: input.system,
    purpose,
    emotionalRationale: "restraint matters more as intelligence and complexity grow",
    constraints: [
      "preserve autonomy",
      "avoid manipulation pressure",
      input.activeSystems.length > 4 ? "reduce adaptive stacking" : "keep orchestration lightweight",
    ],
  };
}
