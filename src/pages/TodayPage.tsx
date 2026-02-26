import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import SortablePinnedPill from "@/components/SortablePinnedPill";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import SEOHead from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { StaggerContainer, StaggerItem } from "@/components/StaggeredReveal";
import { subDays, format, startOfWeek } from "date-fns";
import PageHeader from "@/components/PageHeader";
import SymptomSlider from "@/components/SymptomSlider";
import MoodSelector from "@/components/MoodSelector";

import WeeklySummaryBanner from "@/components/WeeklySummaryBanner";
import StreakBadge, { useStreak } from "@/components/StreakBadge";
import WeekStreakBadge from "@/components/WeekStreakBadge";
import { useWeekStreak } from "@/hooks/useWeekStreak";
import MondayRecapCard from "@/components/MondayRecapCard";
import StreakMilestoneBanner from "@/components/StreakMilestoneBanner";
import GenericSparkline from "@/components/GenericSparkline";
import { SPARKLINE_CONFIGS, makeSleepConfig, makeHydrationConfig } from "@/components/sparkline/configs";
import InlineQuickLog from "@/components/InlineQuickLog";

import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, CheckCircle2, PenLine, ChevronDown } from "lucide-react";
import MedicationChecklist from "@/components/MedicationChecklist";
import DailyPromptCard from "@/components/DailyPromptCard";
import RiskScoreSummaryCard from "@/components/RiskScoreSummaryCard";
import RiskAlertBanner from "@/components/RiskAlertBanner";

import CompactStreakRow from "@/components/CompactStreakRow";
import { findClosestBadge } from "@/lib/badgeProximity";
import DiagnosisAnniversaryCard from "@/components/DiagnosisAnniversaryCard";
import { useMedStreak } from "@/hooks/useMedStreak";
import { useCognitiveStreak } from "@/hooks/useCognitiveStreak";
import { useRelapseFreeStreak } from "@/hooks/useRelapseFreeStreak";
import { useGroundingStreak } from "@/hooks/useGroundingStreak";
import PullToRefresh from "@/components/PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";

import { useBadgeProximityAlert } from "@/hooks/useBadgeProximityAlert";
import { useRecordBadgeEvent } from "@/hooks/useBadgeEvents";

import SuggestedNextCards from "@/components/SuggestedNextCards";
import HeatAlertCard from "@/components/HeatAlertCard";

import { useSaveEntry, useEntriesInRange, useTodayEntry } from "@/hooks/useEntries";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useDbMedications, useDbMedicationLogs } from "@/hooks/useMedications";
import { toast } from "sonner";
import confetti from "canvas-confetti";

const MILESTONE_DAYS = [7, 14, 30];


function shouldCelebrate(streak: number): boolean {
  if (!MILESTONE_DAYS.includes(streak)) return false;
  return !localStorage.getItem(`milestone_celebrated_${streak}`);
}

function markCelebrated(streak: number) {
  localStorage.setItem(`milestone_celebrated_${streak}`, "1");
}

const greetings = (displayName?: string | null) => {
  const hour = new Date().getHours();
  const name = displayName ? `, ${displayName}` : "";
  if (hour < 12) return `Good morning${name}`;
  if (hour < 18) return `Good afternoon${name}`;
  return `Good evening${name}`;
};

// Which quick-log panel is open (null = none)
type QuickLogMetric = "mood" | "fatigue" | "pain" | "brain_fog" | "sleep" | "mobility" | "spasticity" | "stress" | "hydration" | null;

const TodayPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [fatigue, setFatigue] = useState(0);
  const [pain, setPain] = useState(0);
  const [brainFog, setBrainFog] = useState(0);
  const [mood, setMood] = useState(0);
  const [mobility, setMobility] = useState(0);
  const [spasticity, setSpasticity] = useState(0);
  const [stress, setStress] = useState(0);
  const [moodTags, setMoodTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [logged, setLogged] = useState(false);
  const [openPanel, setOpenPanel] = useState<QuickLogMetric>(null);
  const [savedMetric, setSavedMetric] = useState<QuickLogMetric>(null);
  const [milestoneDismissed, setMilestoneDismissed] = useState(false);
  const [celebratedStreak, setCelebratedStreak] = useState<number | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const sparklineScrollRef = useRef<HTMLDivElement>(null);
  const [showFab, setShowFab] = useState(true);
  const [formInitialized, setFormInitialized] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  // Imperatively block all clicks on the sparkline grid for a short window
  // after a panel closes, so the save button's click can't bleed through.
  const blockGrid = () => {
    const el = gridRef.current;
    if (!el) return;
    const handler = (e: Event) => { e.stopPropagation(); e.preventDefault(); };
    el.addEventListener("click", handler, { capture: true });
    setTimeout(() => el.removeEventListener("click", handler, { capture: true }), 150);
  };

  const closePanel = () => {
    blockGrid();
    setOpenPanel(null);
  };

  const flashSaved = (metric: QuickLogMetric) => {
    // Block the grid immediately so the save button's click event can't bleed
    // through to sparkline cards after the panel unmounts.
    blockGrid();
    setSavedMetric(metric);
    setTimeout(() => setSavedMetric(null), 4000);
  };

  // Hide FAB once the Quick Log section is visible
  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowFab(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { streak, frozeToday, freezesRemaining } = useStreak();
  const medStreak = useMedStreak();
  const relapseStreak = useRelapseFreeStreak();
  const { weekStreak } = useWeekStreak();
  const { streak: cogStreak } = useCognitiveStreak();
  const { totalSessions: groundingSessions } = useGroundingStreak();
  
  const recordBadge = useRecordBadgeEvent();
  useBadgeProximityAlert(
    { logStreak: streak, weekStreak, medStreak, relapseStreak, cogStreak, groundingSessions },
    (badgeIds) => recordBadge.mutate(badgeIds)
  );

  const isMilestone = celebratedStreak !== null
    ? MILESTONE_DAYS.includes(celebratedStreak) && !milestoneDismissed
    : MILESTONE_DAYS.includes(streak) && shouldCelebrate(streak) && !milestoneDismissed;

  const activeMilestoneStreak = celebratedStreak ?? streak;

  const { data: todayEntry, isLoading: todayLoading } = useTodayEntry();
  const alreadyLogged = !!todayEntry && !logged;

  // Pre-populate form with today's existing entry
  useEffect(() => {
    if (todayEntry && !formInitialized) {
      setFatigue(todayEntry.fatigue ?? 0);
      setPain(todayEntry.pain ?? 0);
      setBrainFog(todayEntry.brain_fog ?? 0);
      setMood(todayEntry.mood ?? 0);
      setMobility(todayEntry.mobility ?? 0);
      setSpasticity(todayEntry.spasticity ?? 0);
      setStress(todayEntry.stress ?? 0);
      setMoodTags(todayEntry.mood_tags ?? []);
      setNotes(todayEntry.notes ?? "");
      setSleepHours(todayEntry.sleep_hours != null ? String(todayEntry.sleep_hours) : "");
      setFormInitialized(true);
    }
  }, [todayEntry, formInitialized]);

  const today = new Date();
  const weekStart = format(subDays(today, 6), "yyyy-MM-dd");
  const weekEnd = format(today, "yyyy-MM-dd");
  const { data: weekEntries = [] } = useEntriesInRange(weekStart, weekEnd);

  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const pinnedMetrics = useMemo(() => profile?.pinned_metrics ?? [], [profile]);

  const MAX_PINNED = 4;
  const togglePin = useCallback((metricKey: string) => {
    const current = pinnedMetrics;
    const isUnpinning = current.includes(metricKey);
    if (!isUnpinning && current.length >= MAX_PINNED) {
      toast(`You can pin up to ${MAX_PINNED} metrics`, { duration: 2000 });
      return;
    }
    const next = isUnpinning
      ? current.filter((k) => k !== metricKey)
      : [...current, metricKey];
    updateProfile.mutate({ pinned_metrics: next } as any);
    const allCfgs: Record<string, any> = { ...SPARKLINE_CONFIGS, sleep: makeSleepConfig(profile?.sleep_goal ?? 8), hydration: makeHydrationConfig(profile?.hydration_goal ?? 8) };
    const emoji = allCfgs[metricKey]?.emoji ?? "";
    const label = metricKey.charAt(0).toUpperCase() + metricKey.slice(1);
    toast(isUnpinning ? `${emoji} ${label} unpinned` : `📌 ${label} pinned`, { duration: 1500 });
  }, [pinnedMetrics, updateProfile, profile]);

  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragStart = useCallback(() => {
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = pinnedMetrics.indexOf(active.id as string);
    const newIndex = pinnedMetrics.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(pinnedMetrics, oldIndex, newIndex);
    updateProfile.mutate({ pinned_metrics: reordered } as any);
    toast("Order saved ✓", { duration: 1200 });
    localStorage.setItem("hint_drag_reorder_used", "1");
  }, [pinnedMetrics, updateProfile]);


  const thisWeekMonday = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const { data: thisWeekEntries = [] } = useEntriesInRange(thisWeekMonday, format(today, "yyyy-MM-dd"));

  const weekAvgs = useMemo(() => {
    const avg = (key: "fatigue" | "pain" | "brain_fog" | "mood" | "mobility" | "spasticity" | "stress") => {
      const vals = weekEntries.map((e) => e[key]).filter((v): v is number => v != null);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    return {
      fatigue: avg("fatigue"),
      pain: avg("pain"),
      brain_fog: avg("brain_fog"),
      mood: avg("mood"),
      mobility: avg("mobility"),
      spasticity: avg("spasticity"),
      stress: avg("stress"),
    };
  }, [weekEntries]);

  const saveEntry = useSaveEntry();

  // Shared entry payload — always reflects the latest field values
  const entryPayload = useMemo(() => ({
    date: new Date().toISOString().split("T")[0],
    fatigue,
    pain,
    brain_fog: brainFog,
    mood,
    mobility,
    spasticity,
    stress,
    mood_tags: moodTags,
    notes: notes || null,
    sleep_hours: sleepHours ? Number(sleepHours) : null,
  }), [fatigue, pain, brainFog, mood, mobility, spasticity, stress, moodTags, notes, sleepHours]);

  const toggleMoodTag = (tag: string) => {
    setMoodTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleLog = async () => {
    try {
      const goal = profile?.weekly_log_goal ?? 7;
      const countBefore = thisWeekEntries.length;
      const countAfter = alreadyLogged ? countBefore : countBefore + 1;
      const goalJustReached = countAfter >= goal && countBefore < goal;
      const goalToastKey = `goal_toast_${thisWeekMonday}_${goal}`;

      await saveEntry.mutateAsync(entryPayload);

      if (goalJustReached && !localStorage.getItem(goalToastKey)) {
        localStorage.setItem(goalToastKey, "1");
        toast.success(`You hit your ${goal}-day goal this week! 🎉`, {
          description: "Amazing consistency — keep it up!",
          duration: 5000,
        });
      }

      const newStreak = alreadyLogged ? streak : streak + 1;
      if (MILESTONE_DAYS.includes(newStreak) && shouldCelebrate(newStreak)) {
        setCelebratedStreak(newStreak);
        markCelebrated(newStreak);
      }
      setLogged(true);
    } catch (err: any) {
      toast.error("Failed to save entry: " + err.message);
    }
  };

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["today-entry"] });
    await queryClient.invalidateQueries({ queryKey: ["entries"] });
    await queryClient.invalidateQueries({ queryKey: ["medications"] });
  }, [queryClient]);

  if (logged) {
    return (
      <>
        <PageHeader
          title="Today"
          action={
            <Link to="/profile" className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary">
              <Settings className="h-5 w-5" />
            </Link>
          }
        />
        <div className="mx-auto max-w-lg px-4 py-12 text-center animate-fade-in">
          {isMilestone && (
            <div className="mb-6 text-left">
              <StreakMilestoneBanner
                streak={activeMilestoneStreak}
                onDismiss={() => setMilestoneDismissed(true)}
              />
            </div>
          )}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
            <span className="text-3xl">🧡</span>
          </div>
          <h2 className="font-display text-2xl font-semibold text-foreground">Logged!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Great job taking care of yourself today. Every entry helps you understand your MS better.
          </p>
          <div className="mt-5 mx-auto max-w-xs space-y-3">
            <StreakBadge />
            <WeekStreakBadge />
          </div>
          <button
            onClick={() => setLogged(false)}
            className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-[0.98]"
          >
            Edit today's entry
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead title="Today" description="Your daily MS symptom check-in and wellness overview." />
      <PageHeader
        title="Today"
        subtitle={greetings(profile?.display_name) + " 🧡"}
        action={
          <Link to="/profile" className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary">
            <Settings className="h-5 w-5" />
          </Link>
        }
      />
      <PullToRefresh onRefresh={handleRefresh} className="mx-auto max-w-lg space-y-3 px-4 py-3">
        {/* Pinned metrics compact summary */}
        <AnimatePresence>
          {pinnedMetrics.length > 0 && weekEntries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <StaggerItem>
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
                  <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <SortableContext items={pinnedMetrics} strategy={horizontalListSortingStrategy}>
                      {pinnedMetrics.map((key, i) => {
                        const allConfigs: Record<string, any> = {
                          ...SPARKLINE_CONFIGS,
                          sleep: makeSleepConfig(profile?.sleep_goal ?? 8),
                          hydration: makeHydrationConfig(profile?.hydration_goal ?? 8),
                        };
                        const cfg = allConfigs[key];
                        if (!cfg) return null;
                        const vals = weekEntries
                          .map((e) => (e as any)[cfg.dataKey])
                          .filter((v: unknown): v is number => typeof v === "number");
                        const avg = vals.length ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : null;
                        return (
                          <SortablePinnedPill
                            key={key}
                            id={key}
                            emoji={cfg.emoji}
                            avg={avg}
                            colorFn={cfg.colorFn}
                            unit={cfg.unit}
                            index={i}
                            onScrollTo={(k) => {
                              const el = document.getElementById(`sparkline-${k}`);
                              el?.scrollIntoView({ behavior: "smooth", block: "center" });
                            }}
                            onUnpin={togglePin}
                          />
                        );
                      })}
                    </SortableContext>
                  </DndContext>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20, delay: pinnedMetrics.length * 0.06 }}
                        className="flex items-center gap-1 rounded-full bg-destructive/15 text-destructive px-2.5 py-1.5 flex-shrink-0 active:scale-95 transition-transform text-[10px] font-medium hover:bg-destructive/25"
                      >
                        ✕ Clear
                      </motion.button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="max-w-xs rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear all pins?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will unpin {pinnedMetrics.length} metric{pinnedMetrics.length > 1 ? "s" : ""} from your summary row.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => {
                            updateProfile.mutate({ pinned_metrics: [] } as any);
                            toast("All pins cleared", { duration: 1500 });
                          }}
                        >
                          Clear all
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                {!localStorage.getItem("lp_unpin_used") && (
                  <p className="text-[10px] text-muted-foreground/50 text-center mt-0.5 animate-fade-in">Hold pill to unpin</p>
                )}
                {pinnedMetrics.length >= 2 && !localStorage.getItem("hint_drag_reorder_used") && (
                  <p className="text-[10px] text-muted-foreground/50 text-center mt-0.5 animate-fade-in">Drag ⠿ to reorder pills</p>
                )}
              </StaggerItem>
            </motion.div>
          )}
        </AnimatePresence>


        {todayLoading ? (
          <div className="space-y-3 animate-fade-in">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : (
        <>

        <StaggerItem><RiskAlertBanner /></StaggerItem>

        {isMilestone && (
          <StaggerItem>
            <StreakMilestoneBanner
              streak={activeMilestoneStreak}
              onDismiss={() => setMilestoneDismissed(true)}
            />
          </StaggerItem>
        )}

        <StaggerItem><DiagnosisAnniversaryCard /></StaggerItem>
        <StaggerItem><HeatAlertCard /></StaggerItem>

        {!todayLoading && alreadyLogged && (
          <StaggerItem>
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/8 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Already logged today 🧡</p>
                <p className="text-xs text-muted-foreground">Your entry is saved — update it any time below.</p>
              </div>
            </div>
          </StaggerItem>
        )}

        <StaggerItem><MondayRecapCard /></StaggerItem>

        {/* Compact streak + badge nudge row */}
        <StaggerItem>
          <CompactStreakRow
            logStreak={streak}
            weekStreak={weekStreak}
            medStreak={medStreak}
            relapseStreak={relapseStreak}
            cogStreak={cogStreak}
            groundingSessions={groundingSessions}
            frozeToday={frozeToday}
            freezesRemaining={freezesRemaining}
            nearBadge={(() => {
              const b = findClosestBadge({ logStreak: streak, weekStreak, medStreak, relapseStreak, cogStreak, groundingSessions });
              if (!b) return null;
              return { emoji: b.emoji, name: b.name, pct: Math.round((b.current / b.target) * 100), remaining: b.target - b.current, unit: b.unit, hint: b.hint };
            })()}
          />
        </StaggerItem>

        <StaggerItem><WeeklySummaryBanner /></StaggerItem>

        <StaggerItem>
          <Collapsible defaultOpen={!alreadyLogged}>
            <CollapsibleTrigger className="flex w-full items-center justify-between text-left group">
              <p className="section-label pt-1">📊 Your Week at a Glance</p>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1.5 mt-1.5">
        <RiskScoreSummaryCard />

        {/* 7-day sparklines */}
        <div data-tour="sparklines" ref={gridRef} className={`grid grid-cols-2 gap-1.5${openPanel ? " pointer-events-none" : ""}`}>
           <div id="sparkline-mood"><GenericSparkline entries={weekEntries} config={SPARKLINE_CONFIGS.mood} variant="card"
            saved={savedMetric === "mood"}
            onClick={() => setOpenPanel((p) => p === "mood" ? null : "mood")}
            onLongPress={() => navigate("/insights", { state: { heatmapMetric: "mood" } })} /></div>
          <div id="sparkline-fatigue"><GenericSparkline entries={weekEntries} config={SPARKLINE_CONFIGS.fatigue} variant="card"
            saved={savedMetric === "fatigue"}
            onClick={() => setOpenPanel((p) => p === "fatigue" ? null : "fatigue")}
            onLongPress={() => navigate("/insights", { state: { heatmapMetric: "fatigue" } })} /></div>
          <div id="sparkline-pain"><GenericSparkline entries={weekEntries} config={SPARKLINE_CONFIGS.pain} variant="card"
            saved={savedMetric === "pain"}
            onClick={() => setOpenPanel((p) => p === "pain" ? null : "pain")}
            onLongPress={() => navigate("/insights", { state: { heatmapMetric: "pain" } })} /></div>
          <div id="sparkline-sleep"><GenericSparkline entries={weekEntries} config={makeSleepConfig(profile?.sleep_goal ?? 8)} variant="card"
            saved={savedMetric === "sleep"}
            onClick={() => setOpenPanel((p) => p === "sleep" ? null : "sleep")}
            onLongPress={() => navigate("/insights", { state: { heatmapMetric: "sleep_hours" } })} /></div>
          <div id="sparkline-brain_fog"><GenericSparkline entries={weekEntries} config={SPARKLINE_CONFIGS.brain_fog} variant="card"
            saved={savedMetric === "brain_fog"}
            onClick={() => setOpenPanel((p) => p === "brain_fog" ? null : "brain_fog")}
            onLongPress={() => navigate("/insights", { state: { heatmapMetric: "brain_fog" } })} /></div>
          <div id="sparkline-mobility"><GenericSparkline entries={weekEntries} config={SPARKLINE_CONFIGS.mobility} variant="card"
            saved={savedMetric === "mobility"}
            onClick={() => setOpenPanel((p) => p === "mobility" ? null : "mobility")}
            onLongPress={() => navigate("/insights", { state: { heatmapMetric: "mobility" } })} /></div>
          <div id="sparkline-spasticity"><GenericSparkline entries={weekEntries} config={SPARKLINE_CONFIGS.spasticity} variant="card"
            saved={savedMetric === "spasticity"}
            onClick={() => setOpenPanel((p) => p === "spasticity" ? null : "spasticity")}
            onLongPress={() => navigate("/insights", { state: { heatmapMetric: "spasticity" } })} /></div>
          <div id="sparkline-stress"><GenericSparkline entries={weekEntries} config={SPARKLINE_CONFIGS.stress} variant="card"
            saved={savedMetric === "stress"}
            onClick={() => setOpenPanel((p) => p === "stress" ? null : "stress")}
            onLongPress={() => navigate("/insights", { state: { heatmapMetric: "stress" } })} /></div>
          <div id="sparkline-hydration"><GenericSparkline entries={weekEntries} config={makeHydrationConfig(profile?.hydration_goal ?? 8)} variant="card"
            saved={savedMetric === "hydration"}
            onClick={() => setOpenPanel((p) => p === "hydration" ? null : "hydration")}
            onLongPress={() => navigate("/insights", { state: { heatmapMetric: "water_glasses" } })} /></div>
        </div>
            </CollapsibleContent>
          </Collapsible>
        </StaggerItem>

        {/* Inline quick-log panels */}
        {openPanel === "mood" && (
          <InlineQuickLog
            metric="mood" label="Mood" emoji="😊" higherIsBetter
            value={mood} onChange={setMood}
            onClose={closePanel}
            onSaved={() => flashSaved("mood")}
            entryPayload={entryPayload}
            saveAsync={saveEntry.mutateAsync}
            isSaving={saveEntry.isPending}
          />
        )}
        {openPanel === "fatigue" && (
          <InlineQuickLog
            metric="fatigue" label="Fatigue" emoji="🔋"
            value={fatigue} onChange={setFatigue}
            onClose={closePanel}
            onSaved={() => flashSaved("fatigue")}
            entryPayload={entryPayload}
            saveAsync={saveEntry.mutateAsync}
            isSaving={saveEntry.isPending}
          />
        )}
        {openPanel === "pain" && (
          <InlineQuickLog
            metric="pain" label="Pain" emoji="⚡"
            value={pain} onChange={setPain}
            onClose={closePanel}
            onSaved={() => flashSaved("pain")}
            entryPayload={entryPayload}
            saveAsync={saveEntry.mutateAsync}
            isSaving={saveEntry.isPending}
          />
        )}
        {openPanel === "brain_fog" && (
          <InlineQuickLog
            metric="brain_fog" label="Brain fog" emoji="🌫️"
            value={brainFog} onChange={setBrainFog}
            onClose={closePanel}
            onSaved={() => flashSaved("brain_fog")}
            entryPayload={entryPayload}
            saveAsync={saveEntry.mutateAsync}
            isSaving={saveEntry.isPending}
          />
        )}
        {openPanel === "mobility" && (
          <InlineQuickLog
            metric="mobility" label="Mobility" emoji="🚶" higherIsBetter
            value={mobility} onChange={setMobility}
            onClose={closePanel}
            onSaved={() => flashSaved("mobility")}
            entryPayload={entryPayload}
            saveAsync={saveEntry.mutateAsync}
            isSaving={saveEntry.isPending}
          />
        )}
        {openPanel === "spasticity" && (
          <InlineQuickLog
            metric="spasticity" label="Spasticity" emoji="🦵"
            value={spasticity} onChange={setSpasticity}
            onClose={closePanel}
            onSaved={() => flashSaved("spasticity")}
            entryPayload={entryPayload}
            saveAsync={saveEntry.mutateAsync}
            isSaving={saveEntry.isPending}
          />
        )}
        {openPanel === "stress" && (
          <InlineQuickLog
            metric="stress" label="Stress" emoji="😰"
            value={stress} onChange={setStress}
            onClose={closePanel}
            onSaved={() => flashSaved("stress")}
            entryPayload={entryPayload}
            saveAsync={saveEntry.mutateAsync}
            isSaving={saveEntry.isPending}
          />
        )}

        {/* Hydration inline panel — +/- counter UI */}
        {openPanel === "hydration" && (() => {
          const goal = profile?.hydration_goal ?? 8;
          const currentGlasses = todayEntry?.water_glasses ?? 0;
          return (
            <div onClick={(e) => e.stopPropagation()} className="rounded-xl bg-card shadow-soft px-4 py-3 animate-fade-in border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-foreground">💧 Glasses of water today</label>
                <button
                  onClick={() => setOpenPanel(null)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded-md hover:bg-secondary"
                >
                  Done
                </button>
              </div>

              {/* Goal editor */}
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground font-medium">Daily goal:</span>
                {[4, 6, 8, 10, 12].map((g) => (
                  <button
                    key={g}
                    onClick={() => updateProfile.mutate({ hydration_goal: g } as any)}
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors border ${
                      goal === g
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={async () => {
                    if (currentGlasses <= 0) return;
                    const next = currentGlasses - 1;
                    try {
                      await saveEntry.mutateAsync({ ...entryPayload, water_glasses: next } as any);
                      flashSaved("hydration");
                      toast.success(`Water: ${next} glasses 💧`);
                    } catch (err: any) { toast.error("Failed: " + err.message); }
                  }}
                  disabled={currentGlasses <= 0 || saveEntry.isPending}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-all active:scale-95 disabled:opacity-40"
                >−</button>
                <div className="text-center">
                  <span className={`text-2xl font-bold tabular-nums ${currentGlasses >= goal ? "text-primary" : "text-foreground"}`}>
                    {currentGlasses}
                  </span>
                  <span className="text-sm text-muted-foreground"> / {goal}</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {currentGlasses >= goal ? "Goal reached! 🎉" : `${goal - currentGlasses} more to go`}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (currentGlasses >= 20) return;
                    const next = currentGlasses + 1;
                    try {
                      await saveEntry.mutateAsync({ ...entryPayload, water_glasses: next } as any);
                      flashSaved("hydration");
                      if (next >= goal && (next - 1) < goal) { confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 }, colors: ["#38bdf8", "#06b6d4", "#22d3ee"] }); toast.success("Hydration goal reached! 💧🎉"); }
                      else toast.success(`Water: ${next} glasses 💧`);
                    } catch (err: any) { toast.error("Failed: " + err.message); }
                  }}
                  disabled={currentGlasses >= 20 || saveEntry.isPending}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all active:scale-95 disabled:opacity-40"
                >+</button>
              </div>
              {/* Quick-add presets */}
              <div className="flex items-center justify-center gap-2 mt-2.5">
                {[2, 3, 4].map((amt) => (
                  <button
                    key={amt}
                    onClick={async () => {
                      const next = Math.min(20, currentGlasses + amt);
                      if (next === currentGlasses) return;
                      try {
                        await saveEntry.mutateAsync({ ...entryPayload, water_glasses: next } as any);
                        flashSaved("hydration");
                        if (next >= goal && currentGlasses < goal) { confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 }, colors: ["#38bdf8", "#06b6d4", "#22d3ee"] }); toast.success("Hydration goal reached! 💧🎉"); }
                        else toast.success(`Water: ${next} glasses 💧`);
                      } catch (err: any) { toast.error("Failed: " + err.message); }
                    }}
                    disabled={currentGlasses >= 20 || saveEntry.isPending}
                    className="rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-primary/15 hover:border-primary/40 active:scale-95 disabled:opacity-40"
                  >
                    +{amt} 💧
                  </button>
                ))}
              </div>
              {/* Guide */}
              <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2 space-y-0.5">
                <p className="text-[11px] font-medium text-foreground">What counts as 1 glass?</p>
                <p className="text-[10px] text-muted-foreground">1 glass = ~250 ml (8 oz) of water, tea, or sugar-free drink.</p>
                <p className="text-[10px] text-muted-foreground">
                  {goal <= 6
                    ? "💡 Recommended: 6–8 glasses/day. Increase if active or in warm weather."
                    : goal <= 10
                    ? "💡 Great goal! Stay consistent and sip throughout the day."
                    : "💡 High goal — perfect if you're very active or managing heat sensitivity."}
                </p>
              </div>
            </div>
          );
        })()}

        {/* Sleep inline panel — unique number-input UI */}
        {openPanel === "sleep" && (
          <div onClick={(e) => e.stopPropagation()} className="rounded-xl bg-card shadow-soft px-4 py-3 animate-fade-in border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-foreground">🌙 Hours of sleep last night</label>
              <button
                onClick={() => setOpenPanel(null)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded-md hover:bg-secondary"
              >
                Done
              </button>
            </div>
            {/* Sleep goal editor */}
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground font-medium">Nightly goal:</span>
              {[4.5, 5, 6, 7, 7.5, 8, 9, 10].map((g) => (
                <button
                  key={g}
                  onClick={() => updateProfile.mutate({ sleep_goal: g } as any)}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors border ${
                    (profile?.sleep_goal ?? 8) === g
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {g}h
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={24}
                step={0.5}
                placeholder="e.g. 7.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(e.target.value)}
                autoFocus
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground">hrs</span>
              <button
                onClick={async () => {
                  if (!sleepHours) { closePanel(); return; }
                  try {
                    await saveEntry.mutateAsync({ ...entryPayload, sleep_hours: Number(sleepHours) });
                    flashSaved("sleep");
                    closePanel();
                    toast.success("Sleep logged! 🌙");
                  } catch (err: any) {
                    toast.error("Failed to save: " + err.message);
                  }
                }}
                disabled={saveEntry.isPending || !sleepHours}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50 transition-all hover:opacity-90 active:scale-[0.98]"
              >
                {saveEntry.isPending ? "Saving…" : "Save"}
              </button>
            </div>
            {/* Guide */}
            <div className="mt-2.5 rounded-lg bg-muted/50 px-3 py-2 space-y-0.5">
              <p className="text-[11px] font-medium text-foreground">How much sleep do I need?</p>
              <p className="text-[10px] text-muted-foreground">Most adults need 7–9 hours. People with MS often benefit from closer to 8–9 hours.</p>
              <p className="text-[10px] text-muted-foreground">
                {!sleepHours
                  ? "💡 Log your sleep to track patterns over time."
                  : Number(sleepHours) < 6
                  ? "⚠️ Under 6 hours can worsen fatigue, brain fog, and mood."
                  : Number(sleepHours) <= 9
                  ? "💡 Great range! Consistency matters more than a single night."
                  : "💡 Oversleeping can also affect energy — aim for 7–9 hours."}
              </p>
            </div>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center -mt-1.5">
          Tap to log · hold to see insights
        </p>

        {!alreadyLogged && <StaggerItem><SuggestedNextCards /></StaggerItem>}

        {/* Section: Full Check-In — merged symptoms + mood/sleep/notes */}
        <StaggerItem>
          <Collapsible defaultOpen={!alreadyLogged}>
            <CollapsibleTrigger className="flex w-full items-center justify-between card-base text-left group">
              <p className="section-label">✏️ Full Check-In</p>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground/50 bg-muted rounded-full px-2 py-0.5">
                  Slide to rate
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-2">
              <div data-tour="quick-log" ref={logRef} className="card-base space-y-2.5">
                <SymptomSlider label="Fatigue" emoji="🔋" value={fatigue} onChange={setFatigue} weekAvg={weekAvgs.fatigue} />
                <SymptomSlider label="Pain" emoji="⚡" value={pain} onChange={setPain} weekAvg={weekAvgs.pain} />
                <SymptomSlider label="Brain Fog" emoji="🌫️" value={brainFog} onChange={setBrainFog} weekAvg={weekAvgs.brain_fog} />
                <SymptomSlider label="Mood" emoji="😊" value={mood} onChange={setMood} weekAvg={weekAvgs.mood} higherIsBetter />
                <SymptomSlider label="Mobility" emoji="🚶" value={mobility} onChange={setMobility} weekAvg={weekAvgs.mobility} />
                <SymptomSlider label="Spasticity" emoji="🦵" value={spasticity} onChange={setSpasticity} weekAvg={weekAvgs.spasticity} />
                <SymptomSlider label="Stress" emoji="😰" value={stress} onChange={setStress} weekAvg={weekAvgs.stress} />
              </div>

              <div data-tour="mood-tags">
                <MoodSelector selected={moodTags} onToggle={toggleMoodTag} />
              </div>

              <div className="card-base space-y-2">
                <label className="block text-sm font-medium text-foreground">💤 Hours of sleep</label>
                {/* Sleep goal editor */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground font-medium">Nightly goal:</span>
                  {[4.5, 5, 6, 7, 7.5, 8, 9, 10].map((g) => (
                    <button
                      key={g}
                      onClick={() => updateProfile.mutate({ sleep_goal: g } as any)}
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors border ${
                        (profile?.sleep_goal ?? 8) === g
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                      }`}
                    >
                      {g}h
                    </button>
                  ))}
                </div>
                <input type="number" min={0} max={24} step={0.5} placeholder="e.g. 7.5" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                <div className="rounded-lg bg-muted/50 px-3 py-2 space-y-0.5">
                  <p className="text-[11px] font-medium text-foreground">How much sleep do I need?</p>
                  <p className="text-[10px] text-muted-foreground">Most adults need 7–9 hours. People with MS often benefit from closer to 8–9 hours.</p>
                  <p className="text-[10px] text-muted-foreground">
                    {!sleepHours
                      ? "💡 Log your sleep to track patterns over time."
                      : Number(sleepHours) < 6
                      ? "⚠️ Under 6 hours can worsen fatigue, brain fog, and mood."
                      : Number(sleepHours) <= 9
                      ? "💡 Great range! Consistency matters more than a single night."
                      : "💡 Oversleeping can also affect energy — aim for 7–9 hours."}
                  </p>
                </div>
              </div>

              {/* Hydration in full check-in */}
              {(() => {
                const goal = profile?.hydration_goal ?? 8;
                const currentGlasses = todayEntry?.water_glasses ?? 0;
                return (
                  <div className="card-base space-y-3">
                    <label className="block text-sm font-medium text-foreground">💧 Glasses of water</label>

                    {/* Goal editor */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground font-medium">Daily goal:</span>
                      {[4, 6, 8, 10, 12].map((g) => (
                        <button
                          key={g}
                          onClick={() => updateProfile.mutate({ hydration_goal: g } as any)}
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors border ${
                            goal === g
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={async () => {
                          if (currentGlasses <= 0) return;
                          const next = currentGlasses - 1;
                          try {
                            await saveEntry.mutateAsync({ ...entryPayload, water_glasses: next } as any);
                            toast.success(`Water: ${next} glasses 💧`);
                          } catch (err: any) { toast.error("Failed: " + err.message); }
                        }}
                        disabled={currentGlasses <= 0 || saveEntry.isPending}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-all active:scale-95 disabled:opacity-40"
                      >−</button>
                      <div className="text-center flex-1">
                        <span className={`text-xl font-bold tabular-nums ${currentGlasses >= goal ? "text-primary" : "text-foreground"}`}>
                          {currentGlasses}
                        </span>
                        <span className="text-sm text-muted-foreground"> / {goal}</span>
                        {currentGlasses >= goal && <span className="ml-1 text-xs">🎉</span>}
                      </div>
                      <button
                        onClick={async () => {
                          if (currentGlasses >= 20) return;
                          const next = currentGlasses + 1;
                          try {
                            await saveEntry.mutateAsync({ ...entryPayload, water_glasses: next } as any);
                            if (next >= goal && (next - 1) < goal) {
                              confetti({ particleCount: 60, spread: 55, origin: { y: 0.7 }, colors: ["#38bdf8", "#06b6d4", "#22d3ee"] });
                              toast.success("Hydration goal reached! 💧🎉");
                            } else {
                              toast.success(`Water: ${next} glasses 💧`);
                            }
                          } catch (err: any) { toast.error("Failed: " + err.message); }
                        }}
                        disabled={currentGlasses >= 20 || saveEntry.isPending}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all active:scale-95 disabled:opacity-40"
                      >+</button>
                    </div>

                    {/* Guide */}
                    <div className="rounded-lg bg-muted/50 px-3 py-2 space-y-0.5">
                      <p className="text-[11px] font-medium text-foreground">What counts as 1 glass?</p>
                      <p className="text-[10px] text-muted-foreground">1 glass = ~250 ml (8 oz) of water, tea, or sugar-free drink.</p>
                      <p className="text-[10px] text-muted-foreground">
                        {goal <= 6
                          ? "💡 Recommended: 6–8 glasses/day. Increase if active or in warm weather."
                          : goal <= 10
                          ? "💡 Great goal! Stay consistent and sip throughout the day."
                          : "💡 High goal — perfect if you're very active or managing heat sensitivity."}
                      </p>
                    </div>
                  </div>
                );
              })()}


            </CollapsibleContent>
          </Collapsible>
        </StaggerItem>

        {/* Medication checklist */}
        <StaggerItem><MedicationChecklist /></StaggerItem>

        {/* Log button */}
        <StaggerItem>
        <div className="pb-8">
          <button
            onClick={handleLog}
            disabled={saveEntry.isPending}
            className="w-full rounded-full bg-primary py-3.5 text-base font-semibold text-primary-foreground shadow-card transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          >
            {saveEntry.isPending ? "Saving..." : alreadyLogged ? "Update today's entry" : "Save today's entry"}
          </button>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            ⚕️ This is not medical advice. Always consult your neurologist.
          </p>
        </div>
        </StaggerItem>
        </>
        )}
      </PullToRefresh>


      {/* Floating action button */}
      <AnimatePresence>
        {showFab && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => logRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="fixed bottom-24 right-4 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:opacity-90"
            aria-label="Log today"
          >
            <PenLine className="h-4 w-4" />
            Log today
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};

export default TodayPage;
