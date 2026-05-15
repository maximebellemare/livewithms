export function derivePostExerciseReflection(input: {
  attentionLoad: "low" | "moderate" | "high";
  completed: boolean;
}) {
  if (!input.completed) {
    return "You do not need to finish a focus exercise for it to still have been a useful pause.";
  }

  if (input.attentionLoad === "high") {
    return "A small moment of focus can still matter, especially on heavier cognitive days.";
  }

  return "A brief focus reset can be enough. It does not need to become a measure of how the day is going.";
}
