export function deriveNotificationSilence(input: {
  necessity: "silent" | "optional" | "helpful";
  interruptionSafety: "safe" | "soften" | "avoid";
}) {
  return input.necessity === "silent" || input.interruptionSafety === "avoid";
}

