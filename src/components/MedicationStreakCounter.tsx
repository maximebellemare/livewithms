import { useMemo, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { toast } from "@/hooks/use-toast";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { useDbMedications, useDbMedicationLogs } from "@/hooks/useMedications";

export default function MedicationStreakCounter() {
  const today = new Date();
  const startDate = format(subDays(today, 89), "yyyy-MM-dd");
  const endDate = format(today, "yyyy-MM-dd");

  const { data: medications } = useDbMedications();
  const { data: logs } = useDbMedicationLogs(startDate, endDate);

  const activeMeds = useMemo(
    () => (medications ?? []).filter((m) => m.active && m.schedule_type === "daily"),
    [medications],
  );

  const { streak, longestStreak } = useMemo(() => {
    if (activeMeds.length === 0) return { streak: 0, longestStreak: 0 };

    const logsByDate = new Map<string, Set<string>>();
    for (const log of logs ?? []) {
      if (log.status === "taken") {
        const key = log.date;
        if (!logsByDate.has(key)) logsByDate.set(key, new Set());
        logsByDate.get(key)!.add(log.medication_id);
      }
    }

    const days = eachDayOfInterval({ start: subDays(today, 89), end: today }).reverse();
    let current = 0;
    let longest = 0;
    let counting = true;
    let tempStreak = 0;

    for (const d of days) {
      const dateStr = format(d, "yyyy-MM-dd");
      const takenSet = logsByDate.get(dateStr);
      const taken = takenSet ? takenSet.size : 0;
      const perfect = taken >= activeMeds.length;

      if (perfect) {
        tempStreak++;
        if (counting) current = tempStreak;
      } else {
        if (counting) counting = false;
        longest = Math.max(longest, tempStreak);
        tempStreak = 0;
      }
    }
    longest = Math.max(longest, tempStreak);

    return { streak: current, longestStreak: longest };
  }, [activeMeds, logs]);

  // Milestone celebration
  const celebratedRef = useRef<number | null>(null);
  const MILESTONES = [
    { days: 7, label: "7-day perfect med streak! 🔥", emoji: "🔥" },
    { days: 14, label: "14-day perfect med streak! ⭐", emoji: "⭐" },
    { days: 30, label: "30-day perfect med streak! 🏆", emoji: "🏆" },
    { days: 60, label: "60-day perfect med streak! 💎", emoji: "💎" },
    { days: 90, label: "90-day perfect med streak! 👑", emoji: "👑" },
  ];

  useEffect(() => {
    if (streak === 0) return;
    const milestone = [...MILESTONES].reverse().find((m) => streak >= m.days);
    if (!milestone) return;
    if (celebratedRef.current === milestone.days) return;

    const storageKey = `med-streak-celebrated-${milestone.days}`;
    if (sessionStorage.getItem(storageKey)) {
      celebratedRef.current = milestone.days;
      return;
    }

    celebratedRef.current = milestone.days;
    sessionStorage.setItem(storageKey, "true");

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#E8751A", "#FFB347", "#FFDAB9", "#4CAF50", "#42A5F5"],
    });

    toast({
      title: `${milestone.emoji} Milestone reached!`,
      description: milestone.label,
    });
  }, [streak]);

  if (activeMeds.length === 0) return null;

  const emoji = streak >= 7 ? "🔥" : streak >= 3 ? "⚡" : "💊";

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft flex items-center gap-4">
      <div className="flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 text-2xl shrink-0">
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">
          {streak > 0
            ? `${streak}-day perfect streak!`
            : "No current streak"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {streak > 0
            ? "All daily meds taken every day"
            : "Take all your daily meds to start a streak"}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-2xl font-bold text-primary">{streak}</p>
        {longestStreak > streak && (
          <p className="text-[10px] text-muted-foreground">Best: {longestStreak}</p>
        )}
      </div>
    </div>
  );
}
