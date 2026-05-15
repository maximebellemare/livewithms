import type { SeasonalContext } from "../types";

export function deriveSeasonalContext(date: Date = new Date()): SeasonalContext {
  const month = date.getMonth();
  if ([11, 0, 1].includes(month)) {
    return { season: "winter", summary: "Seasonal shifts can sometimes change the feel of energy and routines." };
  }
  if ([2, 3, 4].includes(month)) {
    return { season: "spring", summary: null };
  }
  if ([5, 6, 7].includes(month)) {
    return { season: "summer", summary: null };
  }
  return { season: "autumn", summary: "Changing seasons can sometimes make routines feel a little less settled." };
}

