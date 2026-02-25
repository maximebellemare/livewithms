import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Snowflake } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import confetti from "canvas-confetti";
import { toast } from "@/hooks/use-toast";

const MILESTONES = [7, 14, 30, 50, 100, 200, 365];
const STREAK_NAMES = ["Daily logging", "Weekly goal", "Medication", "Relapse-free", "Cognitive"];

interface CompactStreakRowProps {
  logStreak: number;
  weekStreak: number;
  medStreak: number;
  relapseStreak: number;
  cogStreak: number;
  frozeToday?: boolean;
  freezesRemaining?: number;
  nearBadge?: { emoji: string; name: string; pct: number; remaining: number; unit: string; hint: string } | null;
}

const plural = (n: number, singular: string, pluralForm?: string) =>
  n === 1 ? singular : (pluralForm ?? singular + "s");

const StreakPill = ({ emoji, value, label, labelPlural, zeroTip }: { emoji: string; value: number; label: string; labelPlural?: string; zeroTip?: string }) => {
  const content = (
    <div className={`flex items-center gap-1.5 min-w-0 ${value === 0 ? "opacity-40 cursor-help" : ""}`}>
      <span className="text-base">{emoji}</span>
      <div className="flex flex-col leading-tight">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ scale: 1.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className={`text-base font-extrabold tabular-nums ${value > 0 ? "text-primary" : "text-foreground"}`}
          >
            {value}
          </motion.span>
        </AnimatePresence>
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
  frozeToday = false,
  freezesRemaining = 0,
  nearBadge,
}: CompactStreakRowProps) => {
  const navigate = useNavigate();
  const prevStreaks = useRef<number[]>([]);

  useEffect(() => {
    const current = [logStreak, weekStreak, medStreak, relapseStreak, cogStreak];
    const prev = prevStreaks.current;

    if (prev.length > 0) {
      const milestoneHits: string[] = [];
      current.forEach((val, i) => {
        if (val !== prev[i] && MILESTONES.includes(val)) {
          milestoneHits.push(`${STREAK_NAMES[i]}: ${val} ${val === 1 ? "day" : i === 1 ? "weeks" : "days"}!`);
        }
      });
      if (milestoneHits.length > 0) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#f97316", "#facc15", "#fb923c", "#fbbf24"],
        });
        toast({
          title: "🎉 Streak milestone!",
          description: milestoneHits.join(" · "),
        });
        if (navigator.vibrate) {
          navigator.vibrate([50, 30, 50]);
        }
      }
    }

    prevStreaks.current = current;
  }, [logStreak, weekStreak, medStreak, relapseStreak, cogStreak]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="rounded-xl bg-card shadow-soft flex flex-col gap-2 p-3"
    >
      {/* Streak grid: 3 on top, 2 centered on bottom */}
      <div className="grid grid-cols-3 gap-y-2 justify-items-center">
        <StreakPill emoji="🔥" value={logStreak} label="day" />
        <StreakPill emoji="📊" value={weekStreak} label="week" zeroTip="Log every day for a full week to start your week streak!" />
        <StreakPill emoji="💊" value={medStreak} label="day" zeroTip="Mark your medications as taken to build a med streak!" />
      </div>
      <div className="flex items-center justify-center gap-8">
        <StreakPill emoji="🛡️" value={relapseStreak} label="day" zeroTip="Days since your last relapse — stay strong!" />
        <StreakPill emoji="🧠" value={cogStreak} label="day" zeroTip="Play a cognitive game to start your brain training streak!" />
      </div>

      {/* Freeze indicator */}
      {(frozeToday || freezesRemaining > 0) && (
        <div className="flex items-center gap-1.5 justify-center">
          <Snowflake className={`h-3 w-3 ${frozeToday ? "text-sky-400" : freezesRemaining > 0 ? "text-sky-400/60" : "text-muted-foreground/50"}`} />
          <span className="text-[10px] text-muted-foreground">
            {frozeToday
              ? "Free pass protected your streak today ❄️"
              : "1 free pass available this week"}
          </span>
        </div>
      )}

      {/* Badge nudge */}
      {nearBadge && (
        <>
          <div className="h-px w-full bg-border" />
          <button
            onClick={() => navigate("/badges")}
            className="flex items-center gap-2.5 min-w-0 w-full transition-colors hover:bg-accent/50 -m-1 p-1 rounded-lg active:scale-[0.98]"
          >
            <span className="text-lg flex-shrink-0">{nearBadge.emoji}</span>
            <div className="flex flex-col gap-1.5 leading-tight min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 min-w-0">
                  <Trophy className="h-3 w-3 text-primary flex-shrink-0" />
                  <span className="text-[11px] font-semibold text-foreground truncate">{nearBadge.name}</span>
                </div>
                <span className="text-[11px] font-bold text-primary tabular-nums flex-shrink-0">{nearBadge.pct}%</span>
              </div>
              <Progress value={nearBadge.pct} className={`h-1.5 ${nearBadge.pct >= 75 ? "[&>div]:animate-badge-shimmer [&>div]:bg-[length:200%_100%] [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:via-primary/50 [&>div]:to-primary" : ""}`} />
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground">{nearBadge.hint}</span>
                <span className="text-[10px] font-medium text-primary">{nearBadge.remaining} {nearBadge.unit} to go</span>
              </div>
            </div>
          </button>
        </>
      )}
    </motion.div>
  );
};
export default CompactStreakRow;
