import { derivePremiumPositioning } from "./derivePremiumPositioning";

export function derivePremiumValue() {
  const positioning = derivePremiumPositioning();

  return {
    title: positioning.primaryTitle,
    lines: [
      ...positioning.primaryLines,
      ...positioning.secondaryLines,
      "Calming audio support and nervous-system-friendly resets",
      "Calmer community spaces and quieter support from people who understand",
    ],
    summary: `${positioning.primarySummary} The core app remains supportive without requiring a subscription.`,
  };
}
