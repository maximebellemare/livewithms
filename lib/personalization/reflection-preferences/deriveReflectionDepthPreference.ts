import type { DailyCheckIn } from "../../../features/checkins/types";
import type { ReflectionDepthPreference } from "../types";

export function deriveReflectionDepthPreference(entries: DailyCheckIn[]): ReflectionDepthPreference {
  const notes = entries
    .slice(0, 10)
    .map((entry) => entry.notes?.trim() ?? "")
    .filter(Boolean);

  if (!notes.length) {
    return "balanced";
  }

  const averageLength = notes.reduce((sum, note) => sum + note.length, 0) / notes.length;

  if (averageLength <= 70) {
    return "brief";
  }

  if (averageLength >= 180) {
    return "deeper";
  }

  return "balanced";
}
