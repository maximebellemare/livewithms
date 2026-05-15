import type { PhilosophyTelemetry } from "../types";

export function detectCalmnessRegression(input: {
  emotionalSurfaceCount: number;
  aiSuggestionCount: number;
  notificationPressure?: "low" | "moderate" | "high";
}): PhilosophyTelemetry {
  const reasons: string[] = [];

  if (input.emotionalSurfaceCount > 3) {
    reasons.push("emotional-density-inflation");
  }

  if (input.aiSuggestionCount > 2) {
    reasons.push("ai-overpresence");
  }

  if (input.notificationPressure === "high") {
    reasons.push("notification-pressure-creep");
  }

  return {
    drifted: reasons.length > 0,
    reasons,
  };
}
