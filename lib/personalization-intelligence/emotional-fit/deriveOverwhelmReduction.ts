export function deriveOverwhelmReduction(input: {
  lowEnergy: boolean;
  lowStim: boolean;
  fit: "lighter" | "steady" | "reflective";
}) {
  if (input.lowEnergy || input.lowStim || input.fit === "lighter") {
    return "Reducing choices and emotional density may help support fit more naturally right now.";
  }

  return "Support can stay flexible without adding extra weight to the day.";
}
