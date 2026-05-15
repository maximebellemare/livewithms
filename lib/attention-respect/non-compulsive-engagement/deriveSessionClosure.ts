import type { SessionClosure } from "../types";

export function deriveSessionClosure(input: {
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";
  attentionLoad: "low" | "moderate" | "high";
}) : SessionClosure {
  if (input.adaptiveStatePrimary === "LOW_ENERGY" || input.attentionLoad === "high") {
    return {
      title: "This can be enough for now",
      body: "You can leave here without doing anything else. This can be enough for now.",
      encourageStop: true,
    };
  }

  return {
    title: "You can pause here",
    body: "There is no need to keep going just because more is available.",
    encourageStop: true,
  };
}
