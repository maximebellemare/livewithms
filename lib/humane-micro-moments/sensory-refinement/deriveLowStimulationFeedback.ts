export function deriveLowStimulationFeedback(input: {
  state: "idle" | "saved" | "error" | "loading";
}) {
  if (input.state === "saved") {
    return "soft-confirmation";
  }

  if (input.state === "error") {
    return "quiet-recovery";
  }

  return "minimal";
}
