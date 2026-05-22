export function deriveReminderPressure(input: {
  adaptiveStatePrimary: "LOW_ENERGY" | "OVERWHELMED" | "WITHDRAWN" | "STABLE" | "REFLECTIVE";
  skippedCheckIns: number;
  interruptionSafety: "safe" | "soften" | "avoid";
  reminderEnabled: boolean;
}) {
  if (!input.reminderEnabled) {
    return "low" as const;
  }

  if (
    input.adaptiveStatePrimary === "OVERWHELMED" ||
    input.interruptionSafety === "avoid" ||
    input.skippedCheckIns >= 5
  ) {
    return "high" as const;
  }

  if (
    input.adaptiveStatePrimary === "LOW_ENERGY" ||
    input.adaptiveStatePrimary === "WITHDRAWN" ||
    input.interruptionSafety === "soften" ||
    input.skippedCheckIns >= 3
  ) {
    return "moderate" as const;
  }

  return "low" as const;
}
