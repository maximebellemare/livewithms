import { useMemo } from "react";
import { motion } from "framer-motion";
import { Lock, Trophy } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import PageHeader from "@/components/PageHeader";
import { useStreak } from "@/components/StreakBadge";
import { useWeekStreak } from "@/hooks/useWeekStreak";
import { useRelapses } from "@/hooks/useRelapses";
import { useDbMedications, useDbMedicationLogs } from "@/hooks/useMedications";
import { differenceInDays, parseISO, format, subDays, eachDayOfInterval } from "date-fns";

/* ── Badge definition ───────────────────────────────────── */
interface BadgeDef {
  id: string;
  emoji: string;
  name: string;
  description: string;
  category: "logging" | "weekly" | "medication" | "relapse";
}

const BADGE_DEFS: BadgeDef[] = [
  // Logging streaks
  { id: "log-3", emoji: "⚡", name: "3-Day Logger", description: "Log 3 days in a row", category: "logging" },
  { id: "log-7", emoji: "🔥", name: "Week Warrior", description: "Log 7 days in a row", category: "logging" },
  { id: "log-14", emoji: "⭐", name: "Fortnight Focus", description: "Log 14 days in a row", category: "logging" },
  { id: "log-30", emoji: "🏆", name: "Monthly Master", description: "Log 30 days in a row", category: "logging" },

  // Weekly goal streaks
  { id: "week-2", emoji: "📊", name: "2-Week Goal", description: "Meet weekly goal 2 weeks in a row", category: "weekly" },
  { id: "week-4", emoji: "🗓️", name: "Monthly Rhythm", description: "Meet weekly goal 4 weeks in a row", category: "weekly" },
  { id: "week-8", emoji: "💫", name: "2-Month Flow", description: "Meet weekly goal 8 weeks in a row", category: "weekly" },

  // Medication streaks
  { id: "med-7", emoji: "💊", name: "Med Week", description: "7-day perfect medication adherence", category: "medication" },
  { id: "med-14", emoji: "💉", name: "Med Fortnight", description: "14-day perfect medication adherence", category: "medication" },
  { id: "med-30", emoji: "🏅", name: "Med Month", description: "30-day perfect medication adherence", category: "medication" },
  { id: "med-60", emoji: "💎", name: "Med Diamond", description: "60-day perfect medication adherence", category: "medication" },
  { id: "med-90", emoji: "👑", name: "Med Royalty", description: "90-day perfect medication adherence", category: "medication" },

  // Relapse-free streaks
  { id: "relapse-30", emoji: "🛡️", name: "30 Days Strong", description: "30 days relapse-free", category: "relapse" },
  { id: "relapse-60", emoji: "💪", name: "60 Days Strong", description: "60 days relapse-free", category: "relapse" },
  { id: "relapse-90", emoji: "🌟", name: "90 Days Strong", description: "90 days relapse-free", category: "relapse" },
];

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  logging: { label: "Daily Logging", emoji: "📝" },
  weekly: { label: "Weekly Goals", emoji: "📊" },
  medication: { label: "Medication", emoji: "💊" },
  relapse: { label: "Relapse-Free", emoji: "🛡️" },
};

/* ── Hook: compute medication streak ───────────────────── */
function useMedStreak() {
  const today = new Date();
  const startDate = format(subDays(today, 89), "yyyy-MM-dd");
  const endDate = format(today, "yyyy-MM-dd");
  const { data: medications } = useDbMedications();
  const { data: logs } = useDbMedicationLogs(startDate, endDate);

  return useMemo(() => {
    const activeMeds = (medications ?? []).filter((m) => m.active && m.schedule_type === "daily");
    if (activeMeds.length === 0) return 0;

    const logsByDate = new Map<string, Set<string>>();
    for (const log of logs ?? []) {
      if (log.status === "taken") {
        if (!logsByDate.has(log.date)) logsByDate.set(log.date, new Set());
        logsByDate.get(log.date)!.add(log.medication_id);
      }
    }

    const days = eachDayOfInterval({ start: subDays(today, 89), end: today }).reverse();
    let streak = 0;
    for (const d of days) {
      const dateStr = format(d, "yyyy-MM-dd");
      const taken = logsByDate.get(dateStr)?.size ?? 0;
      if (taken >= activeMeds.length) streak++;
      else break;
    }
    return streak;
  }, [medications, logs]);
}

/* ── Hook: relapse-free days ───────────────────────────── */
function useRelapseFreeStreak() {
  const { data: relapses = [] } = useRelapses();

  return useMemo(() => {
    if (relapses.length === 0) return 0;
    const ongoing = relapses.some((r) => !r.is_recovered);
    if (ongoing) return 0;
    const resolved = relapses.filter((r) => r.is_recovered && r.end_date);
    if (resolved.length === 0) return 0;
    const lastEnd = resolved
      .map((r) => parseISO(r.end_date!))
      .sort((a, b) => b.getTime() - a.getTime())[0];
    return differenceInDays(new Date(), lastEnd);
  }, [relapses]);
}

/* ── Badge Card ────────────────────────────────────────── */
const BadgeCard = ({ badge, earned, index }: { badge: BadgeDef; earned: boolean; index: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 24 }}
    className={`relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all ${
      earned
        ? "border-primary/30 bg-gradient-to-br from-primary/5 via-card to-accent shadow-soft"
        : "border-border/50 bg-card/50 opacity-50 grayscale"
    }`}
  >
    {!earned && (
      <div className="absolute right-2 top-2">
        <Lock className="h-3 w-3 text-muted-foreground" />
      </div>
    )}
    <motion.span
      className="text-3xl"
      animate={earned ? { scale: [1, 1.15, 1] } : {}}
      transition={earned ? { duration: 0.5, repeat: 0 } : {}}
    >
      {badge.emoji}
    </motion.span>
    <p className={`text-xs font-bold leading-tight ${earned ? "text-foreground" : "text-muted-foreground"}`}>
      {badge.name}
    </p>
    <p className="text-[10px] leading-snug text-muted-foreground">{badge.description}</p>
  </motion.div>
);

/* ── Page ──────────────────────────────────────────────── */
const BadgesPage = () => {
  const { streak: logStreak } = useStreak();
  const { weekStreak } = useWeekStreak();
  const medStreak = useMedStreak();
  const relapseStreak = useRelapseFreeStreak();

  const earnedSet = useMemo(() => {
    const set = new Set<string>();

    // Logging
    if (logStreak >= 3) set.add("log-3");
    if (logStreak >= 7) set.add("log-7");
    if (logStreak >= 14) set.add("log-14");
    if (logStreak >= 30) set.add("log-30");

    // Weekly
    if (weekStreak >= 2) set.add("week-2");
    if (weekStreak >= 4) set.add("week-4");
    if (weekStreak >= 8) set.add("week-8");

    // Medication
    if (medStreak >= 7) set.add("med-7");
    if (medStreak >= 14) set.add("med-14");
    if (medStreak >= 30) set.add("med-30");
    if (medStreak >= 60) set.add("med-60");
    if (medStreak >= 90) set.add("med-90");

    // Relapse
    if (relapseStreak >= 30) set.add("relapse-30");
    if (relapseStreak >= 60) set.add("relapse-60");
    if (relapseStreak >= 90) set.add("relapse-90");

    return set;
  }, [logStreak, weekStreak, medStreak, relapseStreak]);

  const earnedCount = earnedSet.size;
  const totalCount = BADGE_DEFS.length;

  const categories = ["logging", "weekly", "medication", "relapse"] as const;

  return (
    <>
      <SEOHead title="Badges" description="View your earned streak milestones and achievements." />
      <PageHeader title="Badges" subtitle="Your achievement collection" />
      <div className="mx-auto max-w-lg px-4 py-4 space-y-6 animate-fade-in">
        {/* Summary */}
        <div className="rounded-2xl bg-card p-5 shadow-soft text-center space-y-2">
          <Trophy className="h-8 w-8 text-primary mx-auto" />
          <p className="text-2xl font-bold text-foreground">
            {earnedCount} <span className="text-sm font-normal text-muted-foreground">/ {totalCount}</span>
          </p>
          <p className="text-xs text-muted-foreground">badges earned</p>
          {/* Progress bar */}
          <div className="mx-auto mt-2 h-2 w-full max-w-[200px] rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(earnedCount / totalCount) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Badge categories */}
        {categories.map((cat) => {
          const badges = BADGE_DEFS.filter((b) => b.category === cat);
          const catEarned = badges.filter((b) => earnedSet.has(b.id)).length;
          const meta = CATEGORY_LABELS[cat];

          return (
            <div key={cat} className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  {meta.emoji} {meta.label}
                </p>
                <span className="text-[10px] text-muted-foreground">
                  {catEarned}/{badges.length}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {badges.map((badge, i) => (
                  <BadgeCard key={badge.id} badge={badge} earned={earnedSet.has(badge.id)} index={i} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default BadgesPage;
