export function deriveSoftProgression(input: {
  completedCount: number;
  totalCount: number;
  intensity: "very-gentle" | "gentle" | "steady";
}) {
  if (input.totalCount === 0) {
    return "Support can stay open-ended.";
  }

  if (input.intensity === "very-gentle") {
    return `One step at a time is enough. ${input.completedCount} of ${input.totalCount} can simply mark what felt usable.`;
  }

  return `${input.completedCount} of ${input.totalCount} can be a quiet record of what you have already used.`;
}
