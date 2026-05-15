import type { DailyCheckIn } from "../../../features/checkins/types";
import type { ReminderWindow } from "../../../features/personalization-memory/types";

function toWindow(dateString: string): ReminderWindow | null {
  const hour = new Date(dateString).getHours();
  if (Number.isNaN(hour)) {
    return null;
  }

  if (hour < 12) {
    return "morning";
  }

  if (hour < 17) {
    return "midday";
  }

  return "evening";
}

export function derivePreferredCheckinWindows(entries: DailyCheckIn[], fallbackWindow: ReminderWindow): ReminderWindow[] {
  const counts = new Map<ReminderWindow, number>([
    ["morning", 0],
    ["midday", 0],
    ["evening", 0],
  ]);

  for (const entry of entries.slice(0, 14)) {
    const window = toWindow(entry.updated_at || entry.created_at);
    if (window) {
      counts.set(window, (counts.get(window) ?? 0) + 1);
    }
  }

  const ranked = [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .filter(([, count]) => count > 0)
    .map(([window]) => window);

  return ranked.length > 0 ? ranked.slice(0, 2) : [fallbackWindow];
}
