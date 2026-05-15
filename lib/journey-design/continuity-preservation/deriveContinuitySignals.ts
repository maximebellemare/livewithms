import { validateObservationSafety } from "../../longitudinal/safety/validateObservationSafety";
import type { LongitudinalEntry } from "../../longitudinal/types";
import type { ContinuitySignal } from "../types";

function gapDays(left: string, right: string) {
  return Math.round(Math.abs(new Date(left).getTime() - new Date(right).getTime()) / (1000 * 60 * 60 * 24));
}

export function deriveContinuitySignals(entries: LongitudinalEntry[]): ContinuitySignal[] {
  if (entries.length < 3) {
    return [];
  }

  const signals: ContinuitySignal[] = [];
  const hasReturnAfterGap = entries.some((entry, index, all) => index > 0 && gapDays(all[index - 1].date, entry.date) >= 4);
  if (hasReturnAfterGap) {
    signals.push({
      title: "Gentle return",
      body: "Even after disrupted periods, there seem to be small ways you return to noticing what matters.",
      kind: "return",
    });
  }

  const hasPacingLanguage = entries.some((entry) => `${entry.notes ?? ""} ${entry.reflection_text ?? ""}`.toLowerCase().match(/\brest\b|\bpace\b|\bslow\b|\bgentle\b/));
  if (hasPacingLanguage) {
    signals.push({
      title: "Pacing remains present",
      body: "Across different stretches, pacing and leaving room for recovery keep showing up as grounding themes.",
      kind: "pacing",
    });
  }

  return signals.flatMap((signal) => {
    const safety = validateObservationSafety(signal.body);
    if (!safety.safe) {
      return [];
    }

    return [{ ...signal, body: safety.sanitizedText }];
  });
}

