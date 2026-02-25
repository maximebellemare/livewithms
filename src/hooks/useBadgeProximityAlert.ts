import { useEffect, useRef } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import type { StreakData } from "@/lib/badgeProximity";

const BADGE_TARGETS = [
  { id: "log-3", emoji: "⚡", name: "3-Day Logger", target: 3, category: "logging" as const },
  { id: "log-7", emoji: "🔥", name: "Week Warrior", target: 7, category: "logging" as const },
  { id: "log-14", emoji: "⭐", name: "Fortnight Focus", target: 14, category: "logging" as const },
  { id: "log-30", emoji: "🏆", name: "Monthly Master", target: 30, category: "logging" as const },
  { id: "week-2", emoji: "📊", name: "2-Week Goal", target: 2, category: "weekly" as const },
  { id: "week-4", emoji: "🗓️", name: "Monthly Rhythm", target: 4, category: "weekly" as const },
  { id: "week-8", emoji: "💫", name: "2-Month Flow", target: 8, category: "weekly" as const },
  { id: "med-7", emoji: "💊", name: "Med Week", target: 7, category: "medication" as const },
  { id: "med-14", emoji: "💉", name: "Med Fortnight", target: 14, category: "medication" as const },
  { id: "med-30", emoji: "🏅", name: "Med Month", target: 30, category: "medication" as const },
  { id: "relapse-30", emoji: "🛡️", name: "30 Days Strong", target: 30, category: "relapse" as const },
  { id: "relapse-60", emoji: "💪", name: "60 Days Strong", target: 60, category: "relapse" as const },
  { id: "relapse-90", emoji: "🌟", name: "90 Days Strong", target: 90, category: "relapse" as const },
  // Cognitive
  { id: "cog-1", emoji: "🧩", name: "First Game", target: 1, category: "cognitive" as const },
  { id: "cog-7", emoji: "🧠", name: "Brain Trainer", target: 7, category: "cognitive" as const },
  { id: "cog-30", emoji: "🎓", name: "Memory Master", target: 30, category: "cognitive" as const },
  // Grounding
  { id: "ground-1", emoji: "🌱", name: "First Grounding", target: 1, category: "grounding" as const },
  { id: "ground-5", emoji: "🌿", name: "Grounded Habit", target: 5, category: "grounding" as const },
  { id: "ground-10", emoji: "🌳", name: "Rooted", target: 10, category: "grounding" as const },
  { id: "ground-25", emoji: "🏕️", name: "Nature's Calm", target: 25, category: "grounding" as const },
  { id: "ground-50", emoji: "🏔️", name: "Mountain Still", target: 50, category: "grounding" as const },
  { id: "ground-100", emoji: "👑", name: "Grounding Master", target: 100, category: "grounding" as const },
];

function streakFor(cat: string, data: StreakData): number {
  switch (cat) {
    case "logging": return data.logStreak;
    case "weekly": return data.weekStreak;
    case "medication": return data.medStreak;
    case "relapse": return data.relapseStreak;
    case "cognitive": return data.cogStreak;
    case "grounding": return data.groundingSessions ?? 0;
    default: return 0;
  }
}

function fireConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.5 },
    colors: ["#E8751A", "#FFB347", "#FFDAB9", "#4CAF50", "#42A5F5", "#AB47BC"],
    disableForReducedMotion: true,
  });
  setTimeout(() => confetti({ particleCount: 40, spread: 50, origin: { y: 0.45, x: 0.3 }, colors: ["#E8751A", "#FFB347"] }), 200);
  setTimeout(() => confetti({ particleCount: 40, spread: 50, origin: { y: 0.45, x: 0.7 }, colors: ["#4CAF50", "#42A5F5"] }), 350);
}

/**
 * Fires a toast once per session when the user is exactly 1 unit away
 * from unlocking a badge, and a confetti celebration when they earn one.
 */
export function useBadgeProximityAlert(data: StreakData, onBadgesEarned?: (badgeNames: string[]) => void) {
  const alertedRef = useRef<Set<string>>(new Set());
  const celebratedRef = useRef<Set<string>>(new Set());
  const onBadgesEarnedRef = useRef(onBadgesEarned);
  onBadgesEarnedRef.current = onBadgesEarned;

  useEffect(() => {
    // ── Proximity alerts (1 away) ──
    const proximityKey = "badge-proximity-alerted";
    const alerted = new Set<string>(
      JSON.parse(sessionStorage.getItem(proximityKey) || "[]")
    );

    const near = BADGE_TARGETS.filter((b) => {
      const current = streakFor(b.category, data);
      return current === b.target - 1 && !alerted.has(b.name) && !alertedRef.current.has(b.name);
    });

    if (near.length > 0) {
      near.forEach((b) => {
        alertedRef.current.add(b.name);
        alerted.add(b.name);
      });
      sessionStorage.setItem(proximityKey, JSON.stringify([...alerted]));

      setTimeout(() => {
        const names = near.map((b) => `${b.emoji} ${b.name}`).join(", ");
        toast("Almost there! 🏅", {
          description: `Just 1 more to unlock: ${names}`,
          duration: 6000,
        });
      }, 800);
    }

    // ── Celebration (just earned) ──
    const celebrationKey = "badge-earned-celebrated";
    const celebrated = new Set<string>(
      JSON.parse(sessionStorage.getItem(celebrationKey) || "[]")
    );

    const justEarned = BADGE_TARGETS.filter((b) => {
      const current = streakFor(b.category, data);
      return current >= b.target && !celebrated.has(b.name) && !celebratedRef.current.has(b.name);
    });

    if (justEarned.length === 0) return;

    justEarned.forEach((b) => {
      celebratedRef.current.add(b.name);
      celebrated.add(b.name);
    });
    sessionStorage.setItem(celebrationKey, JSON.stringify([...celebrated]));

    // Persist to DB via callback
    if (onBadgesEarnedRef.current) {
      onBadgesEarnedRef.current(justEarned.map((b) => b.id));
    }
    setTimeout(() => {
      // Check if ALL badges are now earned
      const allEarned = BADGE_TARGETS.every((b) => {
        const current = streakFor(b.category, data);
        return current >= b.target;
      });

      if (allEarned) {
        // Grand celebration for completing all badges
        fireConfetti();
        setTimeout(() => fireConfetti(), 300);
        setTimeout(() => fireConfetti(), 600);
        toast.success("🏆 ALL BADGES UNLOCKED! 🏆", {
          description: "You've earned every single badge — you're incredible! 🎉🧡",
          duration: 8000,
        });
      } else {
        fireConfetti();
        const names = justEarned.map((b) => `${b.emoji} ${b.name}`).join(", ");
        toast.success(`Badge${justEarned.length > 1 ? "s" : ""} unlocked! 🎉`, {
          description: names,
          duration: 5000,
        });
      }
    }, 500);
  }, [data]);
}
