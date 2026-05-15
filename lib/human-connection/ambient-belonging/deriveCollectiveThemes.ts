import type { CollectiveTheme } from "../types";

export function deriveCollectiveThemes(input: {
  stressTrend: "steady" | "elevated";
  sleepTrend: "steady" | "low";
  reflectionPattern: "quiet" | "active";
  lowEnergyMode: boolean;
}): CollectiveTheme[] {
  const themes: CollectiveTheme[] = [];

  if (input.lowEnergyMode) {
    themes.push({ key: "rest", label: "rest", weight: 0.78 });
    themes.push({ key: "pacing", label: "pacing", weight: 0.74 });
  }

  if (input.stressTrend === "elevated") {
    themes.push({ key: "overwhelm", label: "mental overload", weight: 0.7 });
  }

  if (input.sleepTrend === "low") {
    themes.push({ key: "clarity", label: "uneven clarity", weight: 0.45 });
  }

  if (input.reflectionPattern === "active") {
    themes.push({ key: "gentleness", label: "gentleness", weight: 0.4 });
  }

  return themes;
}

