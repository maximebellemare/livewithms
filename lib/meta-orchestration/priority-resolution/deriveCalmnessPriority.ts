import type { CalmnessPriority } from "../types";

export function deriveCalmnessPriority(input: {
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";
  burden: "low" | "moderate" | "high";
}): CalmnessPriority {
  if (input.adaptiveStatePrimary === "OVERWHELMED") {
    return "emotional-safety";
  }

  if (input.adaptiveStatePrimary === "LOW_ENERGY" || input.burden === "high") {
    return "calmness";
  }

  if (input.adaptiveStatePrimary === "WITHDRAWN" || input.burden === "moderate") {
    return "cognitive-sustainability";
  }

  if (input.adaptiveStatePrimary === "REFLECTIVE") {
    return "autonomy";
  }

  return "personalization";
}
