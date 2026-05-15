import type { GrowthState } from "../../../features/growth/types";
import type { DailyCheckIn } from "../../../features/checkins/types";
import type { SupportStyle } from "../../../features/personalization-memory/types";
import type { InteractionStyleProfile, InteractionStyleWeights } from "../types";

const BASE_WEIGHTS: InteractionStyleWeights = {
  concise: 0.5,
  reflective: 0.5,
  structured: 0.5,
  openEnded: 0.5,
  reassuranceLight: 0.5,
  reassuranceWarm: 0.5,
  practical: 0.5,
  emotionallyReflective: 0.5,
};

function clamp(value: number) {
  return Math.max(0, Math.min(1, Math.round(value * 100) / 100));
}

export function deriveInteractionStyle(input: {
  supportStyle: SupportStyle;
  entries: DailyCheckIn[];
  growthState: GrowthState | null;
}): InteractionStyleProfile {
  const weights: InteractionStyleWeights = { ...BASE_WEIGHTS };
  const notes = input.entries.slice(0, 10).map((entry) => entry.notes?.trim() ?? "").filter(Boolean);
  const averageReflectionLength =
    notes.length > 0 ? notes.reduce((sum, note) => sum + note.length, 0) / notes.length : 0;
  const reflectionSaves = input.growthState?.eventCounts.reflection_saved ?? 0;
  const coachUses = input.growthState?.eventCounts.ai_coach_message_sent ?? 0;

  if (averageReflectionLength <= 60) {
    weights.concise += 0.25;
    weights.reassuranceLight += 0.1;
  } else if (averageReflectionLength >= 180) {
    weights.reflective += 0.25;
    weights.openEnded += 0.15;
    weights.emotionallyReflective += 0.15;
  }

  if (reflectionSaves > coachUses) {
    weights.reflective += 0.2;
    weights.openEnded += 0.1;
  } else if (coachUses > reflectionSaves) {
    weights.concise += 0.1;
    weights.structured += 0.1;
  }

  switch (input.supportStyle) {
    case "calm":
      weights.reassuranceWarm += 0.15;
      weights.concise += 0.05;
      break;
    case "practical":
      weights.practical += 0.25;
      weights.structured += 0.2;
      weights.reassuranceLight += 0.1;
      break;
    case "reflective":
      weights.reflective += 0.25;
      weights.openEnded += 0.2;
      weights.emotionallyReflective += 0.15;
      break;
    case "steady":
    default:
      weights.concise += 0.1;
      weights.practical += 0.1;
      break;
  }

  const normalizedWeights = Object.fromEntries(
    Object.entries(weights).map(([key, value]) => [key, clamp(value)]),
  ) as InteractionStyleWeights;

  const topEntry = Object.entries(normalizedWeights).sort((left, right) => right[1] - left[1])[0];

  return {
    weights: normalizedWeights,
    primaryStyle: (topEntry?.[0] ?? "concise") as keyof InteractionStyleWeights,
    confidence: topEntry?.[1] ?? 0.5,
  };
}
