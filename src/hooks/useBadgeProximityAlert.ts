import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface StreakData {
  logStreak: number;
  weekStreak: number;
  medStreak: number;
  relapseStreak: number;
}

const BADGE_TARGETS = [
  { emoji: "⚡", name: "3-Day Logger", target: 3, category: "logging" as const },
  { emoji: "🔥", name: "Week Warrior", target: 7, category: "logging" as const },
  { emoji: "⭐", name: "Fortnight Focus", target: 14, category: "logging" as const },
  { emoji: "🏆", name: "Monthly Master", target: 30, category: "logging" as const },
  { emoji: "📊", name: "2-Week Goal", target: 2, category: "weekly" as const },
  { emoji: "🗓️", name: "Monthly Rhythm", target: 4, category: "weekly" as const },
  { emoji: "💫", name: "2-Month Flow", target: 8, category: "weekly" as const },
  { emoji: "💊", name: "Med Week", target: 7, category: "medication" as const },
  { emoji: "💉", name: "Med Fortnight", target: 14, category: "medication" as const },
  { emoji: "🏅", name: "Med Month", target: 30, category: "medication" as const },
  { emoji: "🛡️", name: "30 Days Strong", target: 30, category: "relapse" as const },
  { emoji: "💪", name: "60 Days Strong", target: 60, category: "relapse" as const },
  { emoji: "🌟", name: "90 Days Strong", target: 90, category: "relapse" as const },
];

function streakFor(cat: string, data: StreakData): number {
  switch (cat) {
    case "logging": return data.logStreak;
    case "weekly": return data.weekStreak;
    case "medication": return data.medStreak;
    case "relapse": return data.relapseStreak;
    default: return 0;
  }
}

/**
 * Fires a toast once per session when the user is exactly 1 unit away
 * from unlocking a badge.
 */
export function useBadgeProximityAlert(data: StreakData) {
  const alertedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const storageKey = "badge-proximity-alerted";
    const alerted = new Set<string>(
      JSON.parse(sessionStorage.getItem(storageKey) || "[]")
    );

    const near = BADGE_TARGETS.filter((b) => {
      const current = streakFor(b.category, data);
      return current === b.target - 1 && !alerted.has(b.name) && !alertedRef.current.has(b.name);
    });

    if (near.length === 0) return;

    near.forEach((b) => {
      alertedRef.current.add(b.name);
      alerted.add(b.name);
    });
    sessionStorage.setItem(storageKey, JSON.stringify([...alerted]));

    // Slight delay so it doesn't clash with other toasts on page load
    setTimeout(() => {
      const names = near.map((b) => `${b.emoji} ${b.name}`).join(", ");
      toast("Almost there! 🏅", {
        description: `Just 1 more to unlock: ${names}`,
        duration: 6000,
      });
    }, 800);
  }, [data]);
}
