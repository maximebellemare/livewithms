import { REFLECTION_THEME_KEYWORDS } from "../constants";
import type { ReflectionTheme } from "../types";

export function summarizeReflectionThemes(reflections: string[]): ReflectionTheme[] {
  const counts = new Map<string, number>();

  for (const reflection of reflections) {
    const text = reflection.toLowerCase();

    for (const theme of REFLECTION_THEME_KEYWORDS) {
      if (theme.matches.some((match) => text.includes(match))) {
        counts.set(theme.label, (counts.get(theme.label) ?? 0) + 1);
      }
    }
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
    .map(([label, count]) => ({ label, count }));
}
