import {
  EMOTIONAL_HONESTY_MARKERS,
  REFLECTION_SURFACE_DEFAULTS,
  SELF_CRITICISM_MARKERS,
  SELF_KINDNESS_MARKERS,
} from "../constants";
import type { EmotionalContext, LongitudinalEntry } from "../../longitudinal/types";
import type { QuietWinSignal } from "../types";

function normalizeText(entries: LongitudinalEntry[]) {
  return entries
    .map((entry) => entry.reflection_text ?? entry.notes ?? "")
    .join(" ")
    .toLowerCase();
}

function getDayGap(fromDate: string, toDate: string) {
  const from = new Date(`${fromDate}T12:00:00`);
  const to = new Date(`${toDate}T12:00:00`);
  return Math.round((from.getTime() - to.getTime()) / 86_400_000);
}

export function detectQuietWins(entries: LongitudinalEntry[], emotionalContext: EmotionalContext): QuietWinSignal[] {
  if (entries.length === 0) {
    return [];
  }

  const recent = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const recentText = normalizeText(recent.slice(0, 4));
  const priorText = normalizeText(recent.slice(4, 8));
  const recentReflectiveCount = recent
    .slice(0, REFLECTION_SURFACE_DEFAULTS.recentWindowDays)
    .filter((entry) => (entry.reflection_text ?? entry.notes ?? "").trim().length > 0).length;
  const priorReflectiveCount = recent
    .slice(
      REFLECTION_SURFACE_DEFAULTS.recentWindowDays,
      REFLECTION_SURFACE_DEFAULTS.consistencyWindowDays,
    )
    .filter((entry) => (entry.reflection_text ?? entry.notes ?? "").trim().length > 0).length;

  const wins: QuietWinSignal[] = [];
  const previousDate = recent[1]?.date;

  if (previousDate && getDayGap(recent[0].date, previousDate) >= REFLECTION_SURFACE_DEFAULTS.returningGapDays) {
    wins.push("returning-after-absence");
  }

  if (EMOTIONAL_HONESTY_MARKERS.some((marker) => recentText.includes(marker))) {
    wins.push("emotional-honesty");
  }

  if (SELF_KINDNESS_MARKERS.some((marker) => recentText.includes(marker))) {
    wins.push("gentle-pacing");
  }

  if (
    SELF_CRITICISM_MARKERS.some((marker) => priorText.includes(marker)) &&
    !SELF_CRITICISM_MARKERS.some((marker) => recentText.includes(marker))
  ) {
    wins.push("reduced-self-criticism");
  }

  if (recentReflectiveCount > priorReflectiveCount && recentReflectiveCount >= 2) {
    wins.push("improved-consistency");
  }

  if (emotionalContext.recentTone === "steady" || emotionalContext.recentTone === "encouraging") {
    wins.push("calmer-reflections");
  }

  return Array.from(new Set(wins));
}
