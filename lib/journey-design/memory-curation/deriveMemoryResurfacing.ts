import { JOURNEY_DESIGN_DEFAULTS } from "../constants";
import type { MeaningfulReflection, MemoryResurfacing } from "../types";

function daysSince(date: string, now: Date) {
  return Math.round(Math.abs(now.getTime() - new Date(`${date}T12:00:00`).getTime()) / (1000 * 60 * 60 * 24));
}

export function deriveMemoryResurfacing(
  reflections: MeaningfulReflection[],
  now: Date = new Date(),
): MemoryResurfacing | null {
  const candidate = reflections.find(
    (reflection) => daysSince(reflection.date, now) >= JOURNEY_DESIGN_DEFAULTS.memoryResurfacingCooldownDays,
  );

  if (!candidate) {
    return null;
  }

  return {
    shouldResurface: true,
    title: "A grounding note from earlier",
    body: "Something steadier has shown up before. You do not need to recreate it perfectly for it to still matter.",
    reflection: candidate,
  };
}

