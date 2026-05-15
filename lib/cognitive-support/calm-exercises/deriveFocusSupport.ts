export function deriveFocusSupport(input: {
  exerciseType: "attention-reset" | "visual-pacing" | "gentle-sequencing";
  intensity: "very-light" | "light" | "steady";
}) {
  switch (input.exerciseType) {
    case "attention-reset":
      return {
        title: "Keep it very simple",
        body: "A short attention reset may feel easier than trying to push for sustained focus.",
      };
    case "visual-pacing":
      return {
        title: "Follow a quieter pace",
        body: "A slower visual rhythm may help your attention settle without asking too much.",
      };
    default:
      return {
        title: input.intensity === "steady" ? "Try one gentle sequence" : "Keep the sequence short",
        body: "A lightweight sequence can support focus without turning the moment into a test.",
      };
  }
}
