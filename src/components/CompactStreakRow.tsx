import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CompactStreakRowProps {
  logStreak: number;
  weekStreak: number;
  medStreak: number;
  relapseStreak: number;
  cogStreak: number;
  nearBadge?: { emoji: string; name: string; pct: number; remaining: number; unit: string } | null;
}

const plural = (n: number, singular: string, pluralForm?: string) =>
  n === 1 ? singular : (pluralForm ?? singular + "s");

const StreakPill = ({ emoji, value, label, labelPlural, zeroTip }: { emoji: string; value: number; label: string; labelPlural?: string; zeroTip?: string }) => {
  const content = (
    <div className={`flex items-center gap-1.5 min-w-0 ${value === 0 ? "opacity-40 cursor-help" : ""}`}>
      <span className="text-base">{emoji}</span>
      <div className="flex flex-col leading-tight">
        <span className={`text-base font-extrabold tabular-nums ${value > 0 ? "text-primary" : "text-foreground"}`}>{value}</span>
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{plural(value, label, labelPlural)}</span>
      </div>
    </div>
  );

  if (value === 0 && zeroTip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="bottom" align="start" className="max-w-[240px]">
          <p className="text-xs">{zeroTip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }
  return content;
};

const CompactStreakRow = ({
  logStreak,
  weekStreak,
  medStreak,
  relapseStreak,
  cogStreak,
  nearBadge,
}: CompactStreakRowProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="rounded-xl bg-card shadow-soft flex flex-col gap-2 p-3"
    >
      {/* Streak grid: 3 on top, 2 centered on bottom */}
      <div className="grid grid-cols-3 gap-y-2 justify-items-center">
        <div className="flex flex-col items-center gap-0.5">
          <StreakPill emoji="🔥" value={logStreak} label="day" />
          <span className="text-[9px] text-muted-foreground">daily</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <StreakPill emoji="📊" value={weekStreak} label="week" zeroTip="Log every day for a full week to start your week streak!" />
          <span className="text-[9px] text-muted-foreground">weekly</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <StreakPill emoji="💊" value={medStreak} label="day" zeroTip="Mark your medications as taken to build a med streak!" />
          <span className="text-[9px] text-muted-foreground">meds</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-0.5">
          <StreakPill emoji="🛡️" value={relapseStreak} label="day" zeroTip="Days since your last relapse — stay strong!" />
          <span className="text-[9px] text-muted-foreground">relapse-free</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <StreakPill emoji="🧠" value={cogStreak} label="day" zeroTip="Play a cognitive game to start your brain training streak!" />
          <span className="text-[9px] text-muted-foreground">cognitive</span>
        </div>
      </div>

      {/* Badge nudge */}
      {nearBadge && (
        <>
          <div className="h-px w-full bg-border" />
          <button
            onClick={() => navigate("/badges")}
            className="flex items-center gap-2.5 min-w-0 w-full transition-colors hover:bg-accent/50 -m-1 p-1 rounded-lg active:scale-[0.98]"
          >
            <span className="text-lg flex-shrink-0">{nearBadge.emoji}</span>
            <div className="flex flex-col gap-1 leading-tight min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 min-w-0">
                  <Trophy className="h-3 w-3 text-primary flex-shrink-0" />
                  <span className="text-[11px] font-semibold text-foreground truncate">{nearBadge.name}</span>
                </div>
                <span className="text-[11px] font-bold text-primary tabular-nums flex-shrink-0">{nearBadge.pct}%</span>
              </div>
              <Progress value={nearBadge.pct} className={`h-1.5 ${nearBadge.pct >= 75 ? "[&>div]:animate-badge-shimmer [&>div]:bg-[length:200%_100%] [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:via-primary/50 [&>div]:to-primary" : ""}`} />
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
