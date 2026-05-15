export function deriveSharedHumanThemes(input: {
  lowPressureTopics: string[];
  stressTrend: "steady" | "elevated";
  sleepTrend: "steady" | "low";
}) {
  const themes = [...input.lowPressureTopics];

  if (input.stressTrend === "elevated") {
    themes.unshift("needing gentler pacing");
  }

  if (input.sleepTrend === "low") {
    themes.push("lighter sleep affecting the week");
  }

  return Array.from(new Set(themes)).slice(0, 3);
}
