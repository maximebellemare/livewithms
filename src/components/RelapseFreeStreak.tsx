import { useMemo, useEffect, useRef } from "react";
import { useRelapses } from "@/hooks/useRelapses";
import { differenceInDays, parseISO } from "date-fns";
import { Shield } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "@/hooks/use-toast";

export default function RelapseFreeStreak() {
  const { data: relapses = [], isLoading } = useRelapses();

  const { streakDays, longestStreak, hasOngoing } = useMemo(() => {
    if (relapses.length === 0) return { streakDays: null, longestStreak: 0, hasOngoing: false };

    const today = new Date();
    const ongoing = relapses.some((r) => !r.is_recovered);

    // Current streak: days since last relapse ended (or started if no end)
    const resolved = relapses.filter((r) => r.is_recovered && r.end_date);
    let currentStreak = 0;
    if (ongoing) {
      currentStreak = 0;
    } else if (resolved.length > 0) {
      const lastEnd = resolved
        .map((r) => parseISO(r.end_date!))
        .sort((a, b) => b.getTime() - a.getTime())[0];
      currentStreak = differenceInDays(today, lastEnd);
    }

    // Longest streak between relapses
    const sorted = [...relapses].sort(
      (a, b) => parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime()
    );
    let longest = currentStreak;
    for (let i = 1; i < sorted.length; i++) {
      const prevEnd = sorted[i - 1].end_date
        ? parseISO(sorted[i - 1].end_date!)
        : parseISO(sorted[i - 1].start_date);
      const nextStart = parseISO(sorted[i].start_date);
      const gap = differenceInDays(nextStart, prevEnd);
      if (gap > longest) longest = gap;
    }

    return { streakDays: currentStreak, longestStreak: longest, hasOngoing: ongoing };
  }, [relapses]);

  // Milestone celebration
  const celebratedRef = useRef<number | null>(null);
  const MILESTONES = [
    { days: 30, label: "30 days relapse-free! 🌟", emoji: "🌟" },
    { days: 60, label: "60 days relapse-free! 💪", emoji: "💪" },
    { days: 90, label: "90 days relapse-free! 🏆", emoji: "🏆" },
  ];

  useEffect(() => {
    if (hasOngoing || streakDays === null || streakDays === 0) return;

    const milestone = [...MILESTONES].reverse().find((m) => streakDays >= m.days);
    if (!milestone) return;
    if (celebratedRef.current === milestone.days) return;

    // Only celebrate once per session per milestone
    const storageKey = `relapse-streak-celebrated-${milestone.days}`;
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
      colors: ["#E8751A", "#FFB347", "#FFDAB9"],
    });

    toast({
      title: `${milestone.emoji} Milestone reached!`,
      description: milestone.label,
    });
  }, [streakDays, hasOngoing]);

  if (isLoading) return null;

  // Don't show if user has no relapses at all
  if (relapses.length === 0) return null;

  const emoji =
    hasOngoing ? "💛" :
    streakDays! >= 90 ? "🏆" :
    streakDays! >= 30 ? "🌟" :
    streakDays! >= 7 ? "✨" : "🛡️";

  return (
    <div className="card-base">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Relapse-Free Streak</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Main streak */}
        <div className="flex-1 text-center">
          <span className="text-2xl">{emoji}</span>
          {hasOngoing ? (
            <>
              <p className="text-2xl font-bold text-foreground mt-1">Active</p>
              <p className="text-[10px] text-muted-foreground">Ongoing relapse</p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold text-foreground mt-1">
                {streakDays}
                <span className="text-sm font-normal text-muted-foreground ml-1">days</span>
              </p>
              <p className="text-[10px] text-muted-foreground">since last relapse</p>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="h-14 w-px bg-border" />

        {/* Longest streak */}
        <div className="flex-1 text-center">
          <p className="text-lg font-bold text-foreground">
            {longestStreak}
            <span className="text-xs font-normal text-muted-foreground ml-1">days</span>
          </p>
          <p className="text-[10px] text-muted-foreground">longest streak</p>
        </div>
      </div>
    </div>
  );
}
