import { Brain } from "lucide-react";
import { useCognitiveStreak } from "@/hooks/useCognitiveStreak";

const CognitiveStreakBadge = () => {
  const { streak, totalDays } = useCognitiveStreak();

  if (streak === 0 && totalDays === 0) return null;

  const isHot = streak >= 7;
  const isMid = streak >= 3;
  const playedToday = streak > 0;

  return (
    <div
      className={`flex items-center gap-2 rounded-2xl px-4 py-3 shadow-soft animate-fade-in border ${
        isHot
          ? "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800"
          : isMid
          ? "bg-violet-50 dark:bg-violet-950/40 border-violet-200 dark:border-violet-800"
          : "bg-card border-border"
      }`}
    >
      <span
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
          isHot ? "bg-purple-100 dark:bg-purple-900/60"
          : isMid ? "bg-violet-100 dark:bg-violet-900/60"
          : "bg-muted"
        }`}
      >
        <Brain
          className={`h-5 w-5 ${
            isHot ? "text-purple-500 dark:text-purple-400"
            : isMid ? "text-violet-500 dark:text-violet-400"
            : "text-muted-foreground"
          } ${playedToday ? "drop-shadow-[0_0_4px_rgba(139,92,246,0.6)]" : ""}`}
        />
      </span>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold leading-tight ${
          isHot ? "text-purple-700 dark:text-purple-300"
          : isMid ? "text-violet-700 dark:text-violet-300"
          : "text-foreground"
        }`}>
          {streak} day{streak !== 1 ? "s" : ""} brain training
          {isHot ? " 🧠" : isMid ? " 🧩" : ""}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
          {playedToday
            ? streak >= 7 ? "Amazing consistency — your brain thanks you!"
              : streak >= 3 ? "Building a great habit — keep going!"
              : "Nice! Play again tomorrow to build your streak."
            : streak > 0
              ? "Play today to keep your streak alive!"
              : `${totalDays} day${totalDays !== 1 ? "s" : ""} played total — start a new streak!`}
        </p>
      </div>

      <div className={`flex-shrink-0 flex items-center justify-center rounded-full h-9 w-9 text-sm font-extrabold tabular-nums ${
        isHot ? "bg-purple-500 dark:bg-purple-600 text-white"
        : isMid ? "bg-violet-500 dark:bg-violet-600 text-white"
        : "bg-primary text-primary-foreground"
      }`}>
        {streak}
      </div>
    </div>
  );
};

export default CognitiveStreakBadge;
