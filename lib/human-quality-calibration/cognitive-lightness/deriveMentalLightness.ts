import type { HumanQualitySignal } from "../types";

export function deriveMentalLightness(input: {
  burden: "low" | "moderate" | "high";
  visibleChoices: number;
  hasSharpCopy: boolean;
}): HumanQualitySignal {
  const calm = input.burden !== "high" && input.visibleChoices <= 4 && !input.hasSharpCopy;

  return {
    calm,
    summary: calm
      ? "The interaction remains mentally light and easy to move through."
      : "This should be simplified so it feels lighter and less effortful to move through.",
  };
}
