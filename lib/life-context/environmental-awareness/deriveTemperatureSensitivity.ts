import type { LongitudinalEntry } from "../../longitudinal/types";
import type { TemperatureSensitivity, WeatherContext } from "../types";

export function deriveTemperatureSensitivity(
  entries: LongitudinalEntry[],
  weatherContext: WeatherContext,
): TemperatureSensitivity {
  const recentFatigue = entries
    .slice(0, 5)
    .map((entry) => entry.fatigue)
    .filter((value): value is number => typeof value === "number");

  if (weatherContext.temperatureBand === "hot" && recentFatigue.length >= 3 && recentFatigue.every((value) => value >= 4)) {
    return {
      sensitivity: "possible",
      summary: "Warmer days may be worth holding lightly in mind when energy feels lower.",
    };
  }

  return { sensitivity: "unlikely", summary: null };
}

