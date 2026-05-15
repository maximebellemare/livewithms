import type { LongitudinalEntry } from "../../longitudinal/types";
import type { SeasonalRhythm } from "../types";

function monthToSeason(month: number): SeasonalRhythm["season"] {
  if ([11, 0, 1].includes(month)) return "winter";
  if ([2, 3, 4].includes(month)) return "spring";
  if ([5, 6, 7].includes(month)) return "summer";
  return "autumn";
}

export function deriveSeasonalRhythms(entries: LongitudinalEntry[]): SeasonalRhythm[] {
  if (entries.length < 12) {
    return [];
  }

  const grouped = new Map<SeasonalRhythm["season"], LongitudinalEntry[]>();
  for (const entry of entries) {
    const season = monthToSeason(new Date(`${entry.date}T12:00:00`).getMonth());
    grouped.set(season, [...(grouped.get(season) ?? []), entry]);
  }

  return Array.from(grouped.entries())
    .filter(([, seasonEntries]) => seasonEntries.length >= 3)
    .map(([season, seasonEntries]) => {
      const averageFatigue =
        seasonEntries
          .map((entry) => entry.fatigue)
          .filter((value): value is number => typeof value === "number")
          .reduce((sum, value, _, arr) => sum + value / arr.length, 0) || 0;

      return averageFatigue >= 3.8
        ? {
            season,
            title: `${season[0].toUpperCase()}${season.slice(1)} rhythm`,
            body: `${season[0].toUpperCase()}${season.slice(1)} appears to ask for a softer energy pace more often.`,
          }
        : {
            season,
            title: `${season[0].toUpperCase()}${season.slice(1)} rhythm`,
            body: `${season[0].toUpperCase()}${season.slice(1)} seems a little steadier in your longer view.`,
          };
    });
}

