import type { SessionClosure } from "../types";

export function deriveSessionClosure(input: {
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";
  attentionLoad: "low" | "moderate" | "high";
}) : SessionClosure {
  if (input.adaptiveStatePrimary === "LOW_ENERGY" || input.attentionLoad === "high") {
    return {
      title: "Keep this light",
      body: "This can stay brief. Nothing else is needed right now.",
      encourageStop: true,
    };
  }

  return {
    title: "Keep the next step light",
    body: "More is available, but not required.",
    encourageStop: true,
  };
}
