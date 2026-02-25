import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

interface CompactStreakRowProps {
  logStreak: number;
  weekStreak: number;
  medStreak: number;
  relapseStreak: number;
  cogStreak: number;
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
      className="rounded-xl bg-card p-3 shadow-soft flex items-center gap-3"
    >
      {/* Daily streak */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg">🔥</span>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold text-foreground tabular-nums">{logStreak}</span>
          <span className="text-[10px] text-muted-foreground">day streak</span>
        </div>
      </div>

      {/* Divider */}
      {weekStreak > 0 && <div className="h-8 w-px bg-border flex-shrink-0" />}

      {/* Week streak */}
      {weekStreak > 0 && (
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">📊</span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-foreground tabular-nums">{weekStreak}</span>
            <span className="text-[10px] text-muted-foreground">week streak</span>
          </div>
        </div>
      )}

      {/* Badge nudge */}
      {nearBadge && (
        <>
          <div className="h-8 w-px bg-border flex-shrink-0" />
          <button
            onClick={() => navigate("/badges")}
            className="flex items-center gap-2 min-w-0 flex-1 transition-colors hover:bg-accent/50 -m-1.5 p-1.5 rounded-lg active:scale-[0.97]"
          >
            <span className="text-lg flex-shrink-0">{nearBadge.emoji}</span>
            <div className="flex flex-col leading-tight min-w-0">
              <div className="flex items-center gap-1">
                <Trophy className="h-3 w-3 text-primary flex-shrink-0" />
                <span className="text-xs font-semibold text-primary tabular-nums">{nearBadge.pct}%</span>
              </div>
              <span className="text-[10px] text-muted-foreground truncate">
                {nearBadge.remaining} {nearBadge.unit} to go
              </span>
            </div>
          </button>
        </>
      )}
    </motion.div>
  );
};

export default CompactStreakRow;
