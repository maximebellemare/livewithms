import { derivePremiumPositioning } from "./derivePremiumPositioning";

export function derivePremiumValue() {
  const positioning = derivePremiumPositioning();

  return {
    title: positioning.primaryTitle,
    lines: [
      ...positioning.primaryLines,
      ...positioning.secondaryLines.slice(0, 2),
      "Calmer daily structure with less mental sorting",
      "More continuity during difficult periods",
    ],
    summary: `${positioning.primarySummary} The core app remains supportive without requiring a subscription.`,
  };
}
