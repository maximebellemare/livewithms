import { moderateUnsafeContent } from "../emotional-safety/moderateUnsafeContent";
import type { SeasonalResonance } from "../types";

export function generateSeasonalResonance(season: "winter" | "spring" | "summer" | "autumn" | "unknown"): SeasonalResonance | null {
  const body =
    season === "winter"
      ? "At this time of year, slower pacing and extra rest often resonate with people."
      : season === "summer"
        ? "Warmer stretches can make gentler pacing feel more realistic for many people."
        : season === "autumn"
          ? "Changing routines around this time of year often bring pacing back into focus."
          : season === "spring"
            ? "Lighter seasons do not always mean lighter days, and many people notice that too."
            : null;

  if (!body) {
    return null;
  }

  const moderation = moderateUnsafeContent(body);
  if (!moderation.safe) {
    return null;
  }

  return {
    title: "Seasonal resonance",
    body: moderation.sanitizedText,
  };
}

