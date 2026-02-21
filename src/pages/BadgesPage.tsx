import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { Lock, Share2, Trophy, Clock, Grid3X3, Calendar } from "lucide-react";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import BadgeDetailDialog from "@/components/badges/BadgeDetailDialog";
import PageHeader from "@/components/PageHeader";
import { useStreak } from "@/components/StreakBadge";
import { useWeekStreak } from "@/hooks/useWeekStreak";
import { useRelapses } from "@/hooks/useRelapses";
import { useMedStreak } from "@/hooks/useMedStreak";
import { useRelapseFreeStreak } from "@/hooks/useRelapseFreeStreak";
import { useBadgeEvents, useRecordBadgeEvent } from "@/hooks/useBadgeEvents";
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

const BADGE_THRESHOLDS: Record<string, number> = {
  "log-3": 3, "log-7": 7, "log-14": 14, "log-30": 30,
  "week-2": 2, "week-4": 4, "week-8": 8,
  "med-7": 7, "med-14": 14, "med-30": 30, "med-60": 60, "med-90": 90,
  "relapse-30": 30, "relapse-60": 60, "relapse-90": 90,
};

/* ── Badge Card ────────────────────────────────────────── */
const BadgeCard = ({ badge, earned, earnedAt, index, onClick, currentStreak }: { badge: BadgeDef; earned: boolean; earnedAt?: string; index: number; onClick: () => void; currentStreak: number }) => {
  const threshold = BADGE_THRESHOLDS[badge.id] ?? 0;
  const progress = threshold > 0 ? Math.min((currentStreak / threshold) * 100, 100) : 0;
  const nearUnlock = progress >= 75;
  const almostUnlocked = progress >= 90;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 24 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={`relative overflow-hidden flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all cursor-pointer active:scale-95 ${
        earned
          ? "border-primary/30 bg-gradient-to-br from-primary/5 via-card to-accent shadow-soft"
          : almostUnlocked
            ? "border-primary/30 bg-card/70 opacity-90 grayscale-[15%]"
            : nearUnlock
              ? "border-primary/20 bg-card/60 opacity-80 grayscale-[30%]"
              : "border-border/50 bg-card/50 opacity-50 grayscale"
      }`}
    >
      {/* Shimmer overlay for 90%+ badges */}
      {!earned && almostUnlocked && (
        <div
          className="pointer-events-none absolute inset-0 animate-badge-shimmer"
          style={{
            backgroundImage: "linear-gradient(120deg, transparent 30%, hsl(var(--primary) / 0.12) 50%, transparent 70%)",
            backgroundSize: "200% 100%",
          }}
        />
      )}
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
      {earned && earnedAt && (
        <p className="text-[9px] text-primary/70 font-medium">
          {format(new Date(earnedAt), "MMM d, yyyy")}
        </p>
      )}
      {!earned && threshold > 0 && (
        <div className="w-full space-y-1 mt-1">
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${nearUnlock ? "bg-primary" : "bg-primary/40"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className={`text-[9px] ${nearUnlock ? "text-primary/80 font-semibold" : "text-muted-foreground"}`}>
            {currentStreak}/{threshold}
          </p>
        </div>
      )}
    </motion.div>
  );
};

/* ── Page ──────────────────────────────────────────────── */
const BadgesPage = () => {
  const { streak: logStreak } = useStreak();
  const { weekStreak } = useWeekStreak();
  const medStreak = useMedStreak();
  const relapseStreak = useRelapseFreeStreak();
  const { data: badgeEvents = [] } = useBadgeEvents();
  const recordBadge = useRecordBadgeEvent();
  const [selectedBadge, setSelectedBadge] = useState<BadgeDef | null>(null);
  const [view, setView] = useState<"grid" | "timeline">("grid");
  const [timelineFilter, setTimelineFilter] = useState<string>("all");

  // Map badge_id → earned_at for quick lookups
  const earnedAtMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const ev of badgeEvents) {
      map.set(ev.badge_id, ev.earned_at);
    }
    return map;
  }, [badgeEvents]);

  // Timeline: earned badges sorted chronologically (newest first)
  const timelineItems = useMemo(() => {
    return badgeEvents
      .map((ev) => {
        const badge = BADGE_DEFS.find((b) => b.id === ev.badge_id);
        if (!badge) return null;
        return { ...badge, earnedAt: ev.earned_at };
      })
      .filter(Boolean) as (BadgeDef & { earnedAt: string })[];
  }, [badgeEvents]);

  const filteredTimelineItems = useMemo(() => {
    if (timelineFilter === "all") return timelineItems;
    return timelineItems.filter((item) => item.category === timelineFilter);
  }, [timelineItems, timelineFilter]);

  const streakForCategory = useCallback(
    (cat: string) => {
      switch (cat) {
        case "logging": return logStreak;
        case "weekly": return weekStreak;
        case "medication": return medStreak;
        case "relapse": return relapseStreak;
        default: return 0;
      }
    },
    [logStreak, weekStreak, medStreak, relapseStreak]
  );

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
  const allBadgesEarned = earnedCount >= totalCount;
  const earnedBadges = BADGE_DEFS.filter((b) => earnedSet.has(b.id));

  // Record newly earned badges to DB + celebrate (once per session)
  const celebratedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    // Persist any earned badges not yet in the DB
    const unrecorded = earnedBadges
      .filter((b) => !earnedAtMap.has(b.id))
      .map((b) => b.id);
    if (unrecorded.length > 0) {
      recordBadge.mutate(unrecorded);
    }

    // Session celebration
    const storageKey = "badges-celebrated";
    const prev = new Set<string>(JSON.parse(sessionStorage.getItem(storageKey) || "[]"));
    const newBadges = earnedBadges.filter((b) => !prev.has(b.id) && !celebratedRef.current.has(b.id));

    if (newBadges.length === 0) return;

    newBadges.forEach((b) => {
      celebratedRef.current.add(b.id);
      prev.add(b.id);
    });
    sessionStorage.setItem(storageKey, JSON.stringify([...prev]));

    setTimeout(() => {
      confetti({
        particleCount: 60 + newBadges.length * 20,
        spread: 70,
        origin: { y: 0.5 },
        colors: ["#E8751A", "#FFB347", "#FFDAB9", "#4CAF50", "#42A5F5", "#AB47BC"],
        disableForReducedMotion: true,
      });

      const names = newBadges.map((b) => `${b.emoji} ${b.name}`).join(", ");
      toast.success(`New badge${newBadges.length > 1 ? "s" : ""} unlocked!`, {
        description: names,
        duration: 5000,
      });
    }, 400);
  }, [earnedBadges, earnedAtMap]);

  const handleShare = useCallback(async () => {
    const badgeEmojis = earnedBadges.map((b) => b.emoji).join(" ");
    const text = `I've earned ${earnedCount}/${totalCount} badges on LiveWithMS! ${badgeEmojis}\n\nTracking my MS journey one day at a time 🧡`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "My LiveWithMS Badges", text });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Unable to share");
    }
  }, [earnedBadges, earnedCount, totalCount]);

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
            {earnedCount}{allBadgesEarned ? " + 1" : ""} <span className="text-sm font-normal text-muted-foreground">/ {totalCount}</span>
          </p>
          <p className="text-xs text-muted-foreground">{allBadgesEarned ? "all badges + bonus earned" : "badges earned"}</p>
          {/* Progress bar */}
          <div className="mx-auto mt-2 h-2 w-full max-w-[200px] rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(earnedCount / totalCount) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          {earnedCount > 0 && (
            <button
              onClick={handleShare}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share my badges
            </button>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2 justify-center">
          <button
            onClick={() => setView("grid")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              view === "grid"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Grid3X3 className="h-3.5 w-3.5" />
            Grid
          </button>
          <button
            onClick={() => setView("timeline")}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              view === "timeline"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Timeline
          </button>
        </div>

        {view === "grid" ? (
          <>
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
                      <BadgeCard
                        key={badge.id}
                        badge={badge}
                        earned={earnedSet.has(badge.id)}
                        earnedAt={earnedAtMap.get(badge.id)}
                        index={i}
                        currentStreak={streakForCategory(badge.category)}
                        onClick={() => setSelectedBadge(badge)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Completionist bonus badge */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  ✨ Bonus
                </p>
                <span className="text-[10px] text-muted-foreground">
                  {allBadgesEarned ? "1" : "0"}/1
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 24 }}
                  onClick={() => setSelectedBadge({
                    id: "completionist",
                    emoji: "🌈",
                    name: "Completionist",
                    description: "Earn all 15 badges to unlock this legendary achievement",
                    category: "logging",
                  })}
                  role="button"
                  tabIndex={0}
                  className={`relative col-span-3 overflow-hidden flex items-center gap-4 rounded-2xl border p-4 transition-all cursor-pointer active:scale-[0.98] ${
                    allBadgesEarned
                      ? "border-primary/40 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 shadow-soft"
                      : "border-border/50 bg-card/50 opacity-50 grayscale"
                  }`}
                >
                  {allBadgesEarned && (
                    <div
                      className="pointer-events-none absolute inset-0 animate-badge-shimmer"
                      style={{
                        backgroundImage: "linear-gradient(120deg, transparent 20%, hsl(var(--primary) / 0.15) 45%, hsl(var(--accent) / 0.15) 55%, transparent 80%)",
                        backgroundSize: "200% 100%",
                      }}
                    />
                  )}
                  {!allBadgesEarned && (
                    <div className="absolute right-3 top-3">
                      <Lock className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                  <motion.span
                    className="text-4xl flex-shrink-0"
                    animate={allBadgesEarned ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : {}}
                    transition={allBadgesEarned ? { duration: 2, repeat: Infinity, repeatDelay: 3 } : {}}
                  >
                    🌈
                  </motion.span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold leading-tight ${allBadgesEarned ? "text-foreground" : "text-muted-foreground"}`}>
                      Completionist
                    </p>
                    <p className="text-[10px] leading-snug text-muted-foreground mt-0.5">
                      {allBadgesEarned
                        ? "You've earned every single badge — legendary! 🎉"
                        : `Earn all 15 badges to unlock • ${earnedCount}/15`}
                    </p>
                  </div>
                  {allBadgesEarned && (
                    <span className="text-xs font-bold text-primary flex-shrink-0">★</span>
                  )}
                </motion.div>
              </div>
            </div>
          </>
        ) : (
          /* Timeline view */
          <div className="space-y-3">
            {/* Category filter chips */}
            <div className="flex flex-wrap items-center gap-2">
              {[{ key: "all", label: "All", emoji: "🏷️" }, ...categories.map((c) => ({ key: c, ...CATEGORY_LABELS[c] }))].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setTimelineFilter(opt.key)}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                    timelineFilter === opt.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>

            {filteredTimelineItems.length === 0 ? (
              (() => {
                const emptyStates: Record<string, { emoji: string; title: string; message: string }> = {
                  all: { emoji: "🌱", title: "Your journey starts here", message: "Start logging daily to earn your first badge — every small step counts!" },
                  logging: { emoji: "📝", title: "Start your logging streak", message: "Log your symptoms for 3 days in a row to unlock your first Daily Logging badge." },
                  weekly: { emoji: "📊", title: "Build your weekly rhythm", message: "Meet your weekly logging goal 2 weeks in a row to earn your first Weekly badge." },
                  medication: { emoji: "💊", title: "Stay on track", message: "Take all your medications for 7 days straight to earn your first Medication badge." },
                  relapse: { emoji: "🛡️", title: "Every day is progress", message: "Reach 30 days relapse-free to unlock your first milestone in this category." },
                };
                const state = emptyStates[timelineFilter] ?? emptyStates.all;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl bg-card p-8 text-center space-y-3"
                  >
                    <span className="text-4xl block">{state.emoji}</span>
                    <p className="text-sm font-semibold text-foreground">{state.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-[260px] mx-auto">{state.message}</p>
                  </motion.div>
                );
              })()
            ) : (
              <div className="relative">
                <div className="absolute left-5 top-3 bottom-3 w-px bg-border" />

                {filteredTimelineItems.map((item, i) => {
                  const meta = CATEGORY_LABELS[item.category];
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 24 }}
                      onClick={() => setSelectedBadge(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && setSelectedBadge(item)}
                      className="relative flex items-start gap-4 py-3 pl-2 cursor-pointer group"
                    >
                      <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/30 text-lg group-hover:bg-primary/20 transition-colors">
                        {item.emoji}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-foreground truncate">{item.name}</p>
                          <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
                            {meta.emoji} {meta.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-primary/70 font-medium">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(item.earnedAt), "MMMM d, yyyy")}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <BadgeDetailDialog
          badge={selectedBadge}
          earned={selectedBadge ? earnedSet.has(selectedBadge.id) : false}
          earnedAt={selectedBadge ? earnedAtMap.get(selectedBadge.id) : undefined}
          currentStreak={selectedBadge ? streakForCategory(selectedBadge.category) : 0}
          open={!!selectedBadge}
          onOpenChange={(open) => !open && setSelectedBadge(null)}
        />
      </div>
    </>
  );
};

export default BadgesPage;
