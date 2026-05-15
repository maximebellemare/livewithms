export function deriveNonAppCenteredSupport(input: {
  relationalRisk: "low" | "guarded" | "elevated";
  includeOrientationNote: boolean;
}) {
  if (!input.includeOrientationNote) {
    return null;
  }

  if (input.relationalRisk === "elevated") {
    return "This can stay in the background while you return to the rest of your day.";
  }

  return "This may be one small support, not something you need to stay with.";
}
