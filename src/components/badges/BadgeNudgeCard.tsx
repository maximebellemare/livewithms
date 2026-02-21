import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface StreakData {
  logStreak: number;
  weekStreak: number;
  medStreak: number;
  relapseStreak: number;
}

interface NearBadge {
  emoji: string;
  name: string;
  current: number;
  target: number;
  unit: string;
}

const BADGE_TARGETS: { id: string; emoji: string; name: string; target: number; category: "logging" | "weekly" | "medication" | "relapse" }[] = [
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
];

const CATEGORY_UNITS: Record<string, string> = {
  logging: "days",
  weekly: "weeks",
  medication: "days",
  relapse: "days",
};

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
 * Finds the closest unearned badge that's at least 50% complete.
 * Prioritizes by highest completion percentage.
 */
function findClosestBadge(data: StreakData): NearBadge | null {
  let best: NearBadge | null = null;
  let bestPct = -1;

  for (const b of BADGE_TARGETS) {
    const current = streakFor(b.category, data);
    if (current >= b.target) continue; // already earned
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

const BadgeNudgeCard = ({ streakData }: { streakData: StreakData }) => {
  const navigate = useNavigate();
  const nudge = useMemo(() => findClosestBadge(streakData), [streakData]);

  if (!nudge) return null;

  const remaining = nudge.target - nudge.current;
  const pct = Math.round((nudge.current / nudge.target) * 100);
  const almostThere = pct >= 75;

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 24 }}
      onClick={() => navigate("/badges")}
      className="flex w-full flex-col gap-2 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-card p-4 text-left shadow-soft transition-all hover:bg-secondary/50 active:scale-[0.98]"
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary/70">
        <Trophy className="h-3 w-3" />
        Next Badge to Unlock
      </div>
      <div className="flex items-center gap-3">
        <span className="text-2xl flex-shrink-0">{nudge.emoji}</span>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground truncate">{nudge.name}</p>
            <span className="text-xs font-semibold text-primary ml-2 flex-shrink-0">{pct}%</span>
          </div>
          <Progress value={pct} className="h-1.5" />
          <p className="text-[10px] text-muted-foreground">
            {almostThere ? "Almost there! " : ""}{remaining} more {nudge.unit} to go{almostThere ? " 🔥" : " — keep it up! 🧡"}
          </p>
        </div>
      </div>
    </motion.button>
  );
};

export default BadgeNudgeCard;
