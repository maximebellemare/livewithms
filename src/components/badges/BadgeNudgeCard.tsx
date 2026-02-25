import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { findClosestBadge, type StreakData } from "@/lib/badgeProximity";

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
          <div className="flex flex-col gap-0.5">
            <p className="text-[10px] text-muted-foreground">{nudge.hint}</p>
            <p className="text-[10px] font-medium text-primary">{remaining} more {nudge.unit} to go{almostThere ? " 🔥" : ""}</p>
          </div>
        </div>
      </div>
    </motion.button>
  );
};

export default BadgeNudgeCard;
