export function deriveNonJudgmentalEmptyStates(input: {
  context?: "empty" | "loading" | "return";
}) {
  if (input.context === "return") {
    return "You can return to this whenever it feels useful.";
  }

  if (input.context === "loading") {
    return "A brief pause is okay here.";
  }

  return "There does not need to be more here right now.";
}
