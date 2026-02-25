import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

interface CompactStreakRowProps {
  logStreak: number;
  weekStreak: number;
  medStreak: number;
  relapseStreak: number;
  cogStreak: number;
  /** Closest unearned badge info */
  nearBadge?: { emoji: string; name: string; pct: number; remaining: number; unit: string } | null;
}

const CompactStreakRow = ({
  logStreak,
  weekStreak,
  nearBadge,
}: CompactStreakRowProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="flex items-center gap-2 overflow-x-auto scrollbar-hide"
    >
      {/* Daily streak */}
      <div className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 flex-shrink-0">
        <span className="text-sm">🔥</span>
        <span className="text-xs font-semibold text-foreground tabular-nums">{logStreak}d</span>
      </div>

      {/* Week streak */}
      {weekStreak > 0 && (
        <div className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 flex-shrink-0">
          <span className="text-sm">📊</span>
          <span className="text-xs font-semibold text-foreground tabular-nums">{weekStreak}w</span>
        </div>
      )}

      {/* Badge nudge — compact */}
      {nearBadge && (
        <button
          onClick={() => navigate("/badges")}
          className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 flex-shrink-0 transition-colors hover:bg-primary/10 active:scale-[0.97]"
        >
          <Trophy className="h-3 w-3 text-primary" />
          <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">
            {nearBadge.emoji} {nearBadge.remaining} {nearBadge.unit} to go
          </span>
          <span className="text-[10px] font-bold text-primary tabular-nums">{nearBadge.pct}%</span>
        </button>
      )}
    </motion.div>
  );
};

export default CompactStreakRow;
