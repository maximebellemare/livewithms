/** Shared badge-proximity logic used by both BadgeNudgeCard and CompactStreakRow */

export interface StreakData {
  logStreak: number;
  weekStreak: number;
  medStreak: number;
  relapseStreak: number;
  cogStreak: number;
  groundingSessions?: number;
}

export interface NearBadge {
  emoji: string;
  name: string;
  current: number;
  target: number;
  unit: string;
  hint: string;
}

const BADGE_TARGETS: { id: string; emoji: string; name: string; target: number; category: "logging" | "weekly" | "medication" | "relapse" | "cognitive" | "grounding"; hint: string }[] = [
  { id: "log-3", emoji: "⚡", name: "3-Day Logger", target: 3, category: "logging", hint: "Log symptoms 3 days in a row" },
  { id: "log-7", emoji: "🔥", name: "Week Warrior", target: 7, category: "logging", hint: "Log symptoms every day for a week" },
  { id: "log-14", emoji: "⭐", name: "Fortnight Focus", target: 14, category: "logging", hint: "Log symptoms 14 days straight" },
  { id: "log-30", emoji: "🏆", name: "Monthly Master", target: 30, category: "logging", hint: "Log symptoms for a full month" },
  { id: "week-2", emoji: "📊", name: "2-Week Goal", target: 2, category: "weekly", hint: "Hit your weekly log goal 2 weeks running" },
  { id: "week-4", emoji: "🗓️", name: "Monthly Rhythm", target: 4, category: "weekly", hint: "Hit your weekly log goal 4 weeks running" },
  { id: "week-8", emoji: "💫", name: "2-Month Flow", target: 8, category: "weekly", hint: "Hit your weekly log goal 8 weeks running" },
  { id: "med-7", emoji: "💊", name: "Med Week", target: 7, category: "medication", hint: "Take all medications 7 days in a row" },
  { id: "med-14", emoji: "💉", name: "Med Fortnight", target: 14, category: "medication", hint: "Take all medications 14 days straight" },
  { id: "med-30", emoji: "🏅", name: "Med Month", target: 30, category: "medication", hint: "Take all medications for a full month" },
  { id: "med-60", emoji: "💎", name: "Med Diamond", target: 60, category: "medication", hint: "Take all medications for 60 days" },
  { id: "med-90", emoji: "👑", name: "Med Royalty", target: 90, category: "medication", hint: "Take all medications for 90 days" },
  { id: "relapse-30", emoji: "🛡️", name: "30 Days Strong", target: 30, category: "relapse", hint: "Stay relapse-free for 30 days" },
  { id: "relapse-60", emoji: "💪", name: "60 Days Strong", target: 60, category: "relapse", hint: "Stay relapse-free for 60 days" },
  { id: "relapse-90", emoji: "🌟", name: "90 Days Strong", target: 90, category: "relapse", hint: "Stay relapse-free for 90 days" },
  { id: "cog-1", emoji: "🧩", name: "First Game", target: 1, category: "cognitive", hint: "Play your first cognitive game" },
  { id: "cog-7", emoji: "🧠", name: "Brain Trainer", target: 7, category: "cognitive", hint: "Play cognitive games 7 days in a row" },
  { id: "cog-30", emoji: "🎓", name: "Memory Master", target: 30, category: "cognitive", hint: "Play cognitive games for 30 days" },
  { id: "ground-1", emoji: "🌱", name: "First Grounding", target: 1, category: "grounding", hint: "Complete your first grounding session" },
  { id: "ground-5", emoji: "🌿", name: "Grounded Habit", target: 5, category: "grounding", hint: "Complete 5 grounding sessions" },
  { id: "ground-10", emoji: "🌳", name: "Rooted", target: 10, category: "grounding", hint: "Complete 10 grounding sessions" },
  { id: "ground-25", emoji: "🏕️", name: "Nature's Calm", target: 25, category: "grounding", hint: "Complete 25 grounding sessions" },
  { id: "ground-50", emoji: "🏔️", name: "Mountain Still", target: 50, category: "grounding", hint: "Complete 50 grounding sessions" },
  { id: "ground-100", emoji: "👑", name: "Grounding Master", target: 100, category: "grounding", hint: "Complete 100 grounding sessions" },
];

const CATEGORY_UNITS: Record<string, string> = {
  logging: "days",
  weekly: "weeks",
  medication: "days",
  relapse: "days",
  cognitive: "days",
  grounding: "sessions",
};

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
        hint: b.hint,
      };
    }
  }
  return best;
}
