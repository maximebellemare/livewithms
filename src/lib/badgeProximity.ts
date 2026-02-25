/** Shared badge-proximity logic used by both BadgeNudgeCard and CompactStreakRow */

export interface StreakData {
  logStreak: number;
  weekStreak: number;
  medStreak: number;
  relapseStreak: number;
  cogStreak: number;
}

export interface NearBadge {
  emoji: string;
  name: string;
  current: number;
  target: number;
  unit: string;
}

const BADGE_TARGETS: { id: string; emoji: string; name: string; target: number; category: "logging" | "weekly" | "medication" | "relapse" | "cognitive" }[] = [
  { id: "log-3", emoji: "⚡", name: "3-Day Logger", target: 3, category: "logging" },
  { id: "log-7", emoji: "🔥", name: "Week Warrior", target: 7, category: "logging" },
  { id: "log-14", emoji: "⭐", name: "Fortnight Focus", target: 14, category: "logging" },
  { id: "log-30", emoji: "🏆", name: "Monthly Master", target: 30, category: "logging" },
  { id: "week-2", emoji: "📊", name: "2-Week Goal", target: 2, category: "weekly" },
  { id: "week-4", emoji: "🗓️", name: "Monthly Rhythm", target: 4, category: "weekly" },
  { id: "week-8", emoji: "💫", name: "2-Month Flow", target: 8, category: "weekly" },
  { id: "med-7", emoji: "💊", name: "Med Week", target: 7, category: "medication" },
  { id: "med-14", emoji: "💉", name: "Med Fortnight", target: 14, category: "medication" },
  { id: "med-30", emoji: "🏅", name: "Med Month", target: 30, category: "medication" },
  { id: "med-60", emoji: "💎", name: "Med Diamond", target: 60, category: "medication" },
  { id: "med-90", emoji: "👑", name: "Med Royalty", target: 90, category: "medication" },
  { id: "relapse-30", emoji: "🛡️", name: "30 Days Strong", target: 30, category: "relapse" },
  { id: "relapse-60", emoji: "💪", name: "60 Days Strong", target: 60, category: "relapse" },
  { id: "relapse-90", emoji: "🌟", name: "90 Days Strong", target: 90, category: "relapse" },
  { id: "cog-1", emoji: "🧩", name: "First Game", target: 1, category: "cognitive" },
  { id: "cog-7", emoji: "🧠", name: "Brain Trainer", target: 7, category: "cognitive" },
  { id: "cog-30", emoji: "🎓", name: "Memory Master", target: 30, category: "cognitive" },
];

const CATEGORY_UNITS: Record<string, string> = {
  logging: "days",
  weekly: "weeks",
  medication: "days",
  relapse: "days",
  cognitive: "days",
};

function streakFor(cat: string, data: StreakData): number {
  switch (cat) {
    case "logging": return data.logStreak;
    case "weekly": return data.weekStreak;
    case "medication": return data.medStreak;
    case "relapse": return data.relapseStreak;
    case "cognitive": return data.cogStreak;
    default: return 0;
  }
}

export function findClosestBadge(data: StreakData): NearBadge | null {
  let best: NearBadge | null = null;
  let bestPct = -1;

  for (const b of BADGE_TARGETS) {
    const current = streakFor(b.category, data);
    if (current >= b.target) continue;
    const pct = current / b.target;
    if (pct > bestPct) {
      bestPct = pct;
      best = {
        emoji: b.emoji,
        name: b.name,
        current,
        target: b.target,
        unit: CATEGORY_UNITS[b.category],
      };
    }
  }
  return best;
}
