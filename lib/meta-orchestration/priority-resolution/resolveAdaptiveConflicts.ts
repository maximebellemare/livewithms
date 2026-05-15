import { deriveCalmnessPriority } from "./deriveCalmnessPriority";

export function resolveAdaptiveConflicts(input: {
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";
  burden: "low" | "moderate" | "high";
  requests: Array<"personalization" | "reflection-depth" | "contextual-nuance" | "simplification" | "ai-visibility">;
}) {
  const priority = deriveCalmnessPriority({
    adaptiveStatePrimary: input.adaptiveStatePrimary,
    burden: input.burden,
  });

  const suppressed = priority === "emotional-safety" || priority === "calmness"
    ? input.requests.filter((item) => ["reflection-depth", "ai-visibility", "contextual-nuance"].includes(item))
    : [];

  return {
    priority,
    suppressed,
    allowed: input.requests.filter((item) => !suppressed.includes(item)),
  };
}
