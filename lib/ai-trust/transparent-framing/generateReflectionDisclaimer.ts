import type { AiTrustChannel } from "../types";

export function generateReflectionDisclaimer(channel: AiTrustChannel) {
  if (channel === "coach") {
    return "This is supportive reflection, not medical or mental health care.";
  }

  return "These are gentle observations, not medical insights.";
}
