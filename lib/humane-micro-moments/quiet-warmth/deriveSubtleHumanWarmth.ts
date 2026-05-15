export function deriveSubtleHumanWarmth(input: {
  surface: "button" | "save" | "empty" | "loading";
}) {
  switch (input.surface) {
    case "save":
      return "quietly supportive";
    case "empty":
      return "spacious and calm";
    case "loading":
      return "steady and patient";
    default:
      return "grounded and gentle";
  }
}
