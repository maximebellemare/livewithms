import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import SEOHead from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { StaggerContainer, StaggerItem } from "@/components/StaggeredReveal";
import { subDays, format, startOfWeek } from "date-fns";
import PageHeader from "@/components/PageHeader";
import SymptomSlider from "@/components/SymptomSlider";
import MoodSelector from "@/components/MoodSelector";
import QuickCard from "@/components/QuickCard";
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
import { Settings, CheckCircle2, PenLine, FileDown, ChevronDown } from "lucide-react";
import MedicationChecklist from "@/components/MedicationChecklist";
import UpcomingAppointments from "@/components/UpcomingAppointments";
import DailyPromptCard from "@/components/DailyPromptCard";
import HydrationCard from "@/components/HydrationCard";
import RelapseFreeStreakCompact from "@/components/RelapseFreeStreakCompact";
import RelapseRiskIndicator from "@/components/RelapseRiskIndicator";
import RiskScoreSummaryCard from "@/components/RiskScoreSummaryCard";
import RiskAlertBanner from "@/components/RiskAlertBanner";
import BadgeNudgeCard from "@/components/badges/BadgeNudgeCard";
import DiagnosisAnniversaryCard from "@/components/DiagnosisAnniversaryCard";
import { useMedStreak } from "@/hooks/useMedStreak";
import { useCognitiveStreak } from "@/hooks/useCognitiveStreak";
import { useRelapseFreeStreak } from "@/hooks/useRelapseFreeStreak";
import { useGroundingStreak } from "@/hooks/useGroundingStreak";
import { useBadgeProximityAlert } from "@/hooks/useBadgeProximityAlert";
import { useRecordBadgeEvent } from "@/hooks/useBadgeEvents";
import GoalTrackingDashboard from "@/components/GoalTrackingDashboard";
import SuggestedNextCards from "@/components/SuggestedNextCards";
import HeatAlertCard from "@/components/HeatAlertCard";
import ScrollDots from "@/components/ScrollDots";
import { useSaveEntry, useEntriesInRange, useTodayEntry } from "@/hooks/useEntries";
import { useProfile } from "@/hooks/useProfile";
import { useDbMedications, useDbMedicationLogs } from "@/hooks/useMedications";
import { useDbAppointments } from "@/hooks/useAppointments";
import { useRelapses } from "@/hooks/useRelapses";
import { generateReportFromData } from "@/lib/report-generator-db";
import ReportPreviewDialog from "@/components/ReportPreviewDialog";
import { toast } from "sonner";

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
type QuickLogMetric = "mood" | "fatigue" | "pain" | "brain_fog" | "sleep" | "mobility" | "spasticity" | "stress" | null;

const TodayPage = () => {
  const navigate = useNavigate();
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

  const { streak } = useStreak();
  const medStreak = useMedStreak();
  const relapseStreak = useRelapseFreeStreak();
  const { weekStreak } = useWeekStreak();
  const { streak: cogStreak } = useCognitiveStreak();
  const { streak: groundStreak, totalSessions: groundTotal } = useGroundingStreak();
  const recordBadge = useRecordBadgeEvent();
  useBadgeProximityAlert(
    { logStreak: streak, weekStreak, medStreak, relapseStreak, cogStreak },
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
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [showReportPreview, setShowReportPreview] = useState(false);

  // Report data (last 30 days)
  const report30Start = format(subDays(today, 30), "yyyy-MM-dd");
  const report30End = format(today, "yyyy-MM-dd");
  const { data: report30Entries = [] } = useEntriesInRange(report30Start, report30End);
  const { data: reportMeds = [] } = useDbMedications();
  const { data: reportMedLogs = [] } = useDbMedicationLogs(report30Start, report30End);
  const { data: reportAppts = [] } = useDbAppointments();
  const { data: reportRelapses = [] } = useRelapses();

  const handleDownloadReport = async () => {
    setDownloadingReport(true);
    try {
      const filteredAppts = reportAppts.filter((a) => a.date >= report30Start && a.date <= report30End);
      const blob = generateReportFromData({
        startDate: report30Start, endDate: report30End,
        includeSymptoms: true, includeMedications: true, includeAppointments: true,
        includeProfile: true, includeNotes: true, includeRelapses: true, includeHydration: true, includeRiskScore: true, includeTrendCharts: true, includeMoodTags: true, includePeriodComparison: true, includeTriggerAnalysis: true,
        entries: report30Entries, profile: profile || null,
        medications: reportMeds, medLogs: reportMedLogs, appointments: filteredAppts,
        relapses: reportRelapses,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `LiveWithMS-Report-${format(today, "yyyy-MM-dd")}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Report downloaded ✓");
    } catch (err: any) {
      toast.error("Failed to generate report: " + err.message);
    } finally {
      setDownloadingReport(false);
    }
  };

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
      <StaggerContainer className="mx-auto max-w-lg space-y-3 px-4 py-3">
        {/* Weekly mood trend mini-chart */}
        {weekEntries.length > 0 && (
          <StaggerItem>
            <div className="relative sm:contents">
              <div ref={sparklineScrollRef} className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory scrollbar-hide sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible sm:pb-0">
                {/* Higher is better */}
                <div className="min-w-[75vw] snap-start sm:min-w-0"><GenericSparkline entries={weekEntries} config={SPARKLINE_CONFIGS.mood} /></div>
                <div className="min-w-[75vw] snap-start sm:min-w-0"><GenericSparkline entries={weekEntries} config={makeSleepConfig(profile?.sleep_goal ?? 8)} /></div>
                <div className="min-w-[75vw] snap-start sm:min-w-0"><GenericSparkline entries={weekEntries} config={SPARKLINE_CONFIGS.mobility} /></div>
                <div className="min-w-[75vw] snap-start sm:min-w-0"><GenericSparkline entries={weekEntries} config={makeHydrationConfig(profile?.hydration_goal ?? 8)} /></div>
                {/* Lower is better */}
                <div className="min-w-[75vw] snap-start sm:min-w-0"><GenericSparkline entries={weekEntries} config={SPARKLINE_CONFIGS.fatigue} /></div>
                <div className="min-w-[75vw] snap-start sm:min-w-0"><GenericSparkline entries={weekEntries} config={SPARKLINE_CONFIGS.pain} /></div>
                <div className="min-w-[75vw] snap-start sm:min-w-0"><GenericSparkline entries={weekEntries} config={SPARKLINE_CONFIGS.brain_fog} /></div>
                <div className="min-w-[75vw] snap-start sm:min-w-0"><GenericSparkline entries={weekEntries} config={SPARKLINE_CONFIGS.spasticity} /></div>
                <div className="min-w-[75vw] snap-start sm:min-w-0"><GenericSparkline entries={weekEntries} config={SPARKLINE_CONFIGS.stress} /></div>
              </div>
              <div className="absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none sm:hidden" />
            </div>
            <ScrollDots containerRef={sparklineScrollRef} count={9} />
          </StaggerItem>
        )}

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
        <StaggerItem><WeeklySummaryBanner /></StaggerItem>
        <StaggerItem><StreakBadge /></StaggerItem>
        <StaggerItem><WeekStreakBadge /></StaggerItem>
        <StaggerItem><BadgeNudgeCard streakData={{ logStreak: streak, weekStreak, medStreak, relapseStreak, cogStreak }} /></StaggerItem>

        <StaggerItem><GoalTrackingDashboard /></StaggerItem>

        <StaggerItem>
          <p className="section-label pt-1">
            📊 Your Week at a Glance
          </p>
        </StaggerItem>

        <StaggerItem><RiskScoreSummaryCard /></StaggerItem>

        {/* 7-day sparklines */}
        <StaggerItem>
        <div data-tour="sparklines" ref={gridRef} className={`grid grid-cols-2 gap-1.5${openPanel ? " pointer-events-none" : ""}`}>
          <GenericSparkline entries={weekEntries} config={SPARKLINE_CONFIGS.mood} variant="card"
            saved={savedMetric === "mood"}
            onClick={() => setOpenPanel((p) => p === "mood" ? null : "mood")}
            onLongPress={() => navigate("/insights", { state: { heatmapMetric: "mood" } })} />
          <GenericSparkline entries={weekEntries} config={SPARKLINE_CONFIGS.fatigue} variant="card"
            saved={savedMetric === "fatigue"}
            onClick={() => setOpenPanel((p) => p === "fatigue" ? null : "fatigue")}
            onLongPress={() => navigate("/insights", { state: { heatmapMetric: "fatigue" } })} />
          <GenericSparkline entries={weekEntries} config={SPARKLINE_CONFIGS.pain} variant="card"
            saved={savedMetric === "pain"}
            onClick={() => setOpenPanel((p) => p === "pain" ? null : "pain")}
            onLongPress={() => navigate("/insights", { state: { heatmapMetric: "pain" } })} />
          <GenericSparkline entries={weekEntries} config={makeSleepConfig(profile?.sleep_goal ?? 8)} variant="card"
            saved={savedMetric === "sleep"}
            onClick={() => setOpenPanel((p) => p === "sleep" ? null : "sleep")}
            onLongPress={() => navigate("/insights", { state: { heatmapMetric: "sleep_hours" } })} />
          <GenericSparkline entries={weekEntries} config={SPARKLINE_CONFIGS.brain_fog} variant="card"
            saved={savedMetric === "brain_fog"}
            onClick={() => setOpenPanel((p) => p === "brain_fog" ? null : "brain_fog")}
            onLongPress={() => navigate("/insights", { state: { heatmapMetric: "brain_fog" } })} />
          <GenericSparkline entries={weekEntries} config={SPARKLINE_CONFIGS.mobility} variant="card"
            saved={savedMetric === "mobility"}
            onClick={() => setOpenPanel((p) => p === "mobility" ? null : "mobility")}
            onLongPress={() => navigate("/insights", { state: { heatmapMetric: "mobility" } })} />
          <GenericSparkline entries={weekEntries} config={SPARKLINE_CONFIGS.spasticity} variant="card"
            saved={savedMetric === "spasticity"}
            onClick={() => setOpenPanel((p) => p === "spasticity" ? null : "spasticity")}
            onLongPress={() => navigate("/insights", { state: { heatmapMetric: "spasticity" } })} />
          <GenericSparkline entries={weekEntries} config={SPARKLINE_CONFIGS.stress} variant="card"
            saved={savedMetric === "stress"}
            onClick={() => setOpenPanel((p) => p === "stress" ? null : "stress")}
            onLongPress={() => navigate("/insights", { state: { heatmapMetric: "stress" } })} />
          <GenericSparkline entries={weekEntries} config={makeHydrationConfig(profile?.hydration_goal ?? 8)} variant="card"
            onClick={() => navigate("/lifestyle")}
            onLongPress={() => navigate("/lifestyle")} />
        </div>
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
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              Tap <strong>Save</strong> to log instantly, or update below with the full form.
            </p>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center -mt-1.5">
          Tap to log · hold to see insights
        </p>

        <StaggerItem><SuggestedNextCards /></StaggerItem>

        {/* Section: Full Symptom Log — collapsed by default when already logged */}
        <StaggerItem>
          <Collapsible defaultOpen={!alreadyLogged}>
            <CollapsibleTrigger className="flex w-full items-center justify-between card-base text-left group">
              <p className="section-label">✏️ Full Symptom Log</p>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground/50 bg-muted rounded-full px-2 py-0.5">
                  Slide to rate
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div data-tour="quick-log" ref={logRef} className="card-base space-y-2.5 mt-2">
                <SymptomSlider label="Fatigue" emoji="🔋" value={fatigue} onChange={setFatigue} weekAvg={weekAvgs.fatigue} />
                <SymptomSlider label="Pain" emoji="⚡" value={pain} onChange={setPain} weekAvg={weekAvgs.pain} />
                <SymptomSlider label="Brain Fog" emoji="🌫️" value={brainFog} onChange={setBrainFog} weekAvg={weekAvgs.brain_fog} />
                <SymptomSlider label="Mood" emoji="😊" value={mood} onChange={setMood} weekAvg={weekAvgs.mood} higherIsBetter />
                <SymptomSlider label="Mobility" emoji="🚶" value={mobility} onChange={setMobility} weekAvg={weekAvgs.mobility} />
                <SymptomSlider label="Spasticity" emoji="🦵" value={spasticity} onChange={setSpasticity} weekAvg={weekAvgs.spasticity} />
                <SymptomSlider label="Stress" emoji="😰" value={stress} onChange={setStress} weekAvg={weekAvgs.stress} />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </StaggerItem>

        {/* Mood tags + Sleep & Notes — inside same collapsible flow */}
        <StaggerItem>
          <Collapsible defaultOpen={!alreadyLogged}>
            <CollapsibleTrigger className="flex w-full items-center justify-between card-base text-left group">
              <p className="section-label">🏷️ Mood, Sleep & Notes</p>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-2">
              <div data-tour="mood-tags">
                <MoodSelector selected={moodTags} onToggle={toggleMoodTag} />
              </div>

              <div className="card-base">
                <label className="mb-2 block text-sm font-medium text-foreground">
                  💤 Hours of sleep
                </label>
                <input
                  type="number"
                  min={0}
                  max={24}
                  step={0.5}
                  placeholder="e.g. 7.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <DailyPromptCard
                onUsePrompt={(prompt) => {
                  const prefix = notes.trim() ? notes + "\n\n" : "";
                  setNotes(prefix + prompt + " ");
                  setTimeout(() => {
                    notesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                    notesRef.current?.focus();
                  }, 50);
                }}
              />

              <div className="card-base">
                <label className="mb-2 block text-sm font-medium text-foreground">
                  📝 Notes
                </label>
                <textarea
                  ref={notesRef}
                  rows={3}
                  placeholder="Anything else you want to remember..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </StaggerItem>

        {/* Section: Wellness — collapsed by default */}
        <StaggerItem>
          <Collapsible>
            <CollapsibleTrigger className="flex w-full items-center justify-between card-base text-left group">
              <p className="section-label">❤️ Wellness</p>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              <MedicationChecklist />
              <UpcomingAppointments />
              <HydrationCard />
              <RelapseRiskIndicator />
              <RelapseFreeStreakCompact />
              <Collapsible>
                <CollapsibleTrigger className="flex w-full items-center justify-between card-base text-left group">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent text-lg">✨</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">Exercises</p>
                      <p className="text-xs text-muted-foreground">Breathing, grounding & relaxation</p>
                    </div>
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold text-primary">10</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  <QuickCard emoji="🧘" title="Regulation Center" subtitle="Breathing, grounding & vagal tone" onClick={() => navigate("/nervous-system")} />
                  <QuickCard emoji="💪" title="Muscle Relaxation" subtitle="Progressive muscle relaxation exercise" onClick={() => navigate("/coach", { state: { autoSend: "Try progressive muscle relaxation" } })} />
                  <QuickCard emoji="🌬️" title="Box Breathing" subtitle="Calming 4-4-4-4 breathing exercise" onClick={() => navigate("/coach", { state: { autoSend: "Guide me through box breathing" } })} />
                  <QuickCard emoji="🖐️" title="Grounding Exercise" subtitle="5-4-3-2-1 sensory grounding" onClick={() => navigate("/coach", { state: { autoSend: "I'd like a 5-4-3-2-1 grounding exercise" } })} />
                  <QuickCard emoji="💛" title="Self-Compassion" subtitle="Guided self-compassion exercise" onClick={() => navigate("/coach", { state: { autoSend: "Try a self-compassion exercise with me" } })} />
                  <QuickCard emoji="🔄" title="Thought Reframing" subtitle="Reframe a negative thought" onClick={() => navigate("/coach", { state: { autoSend: "Help me reframe a negative thought" } })} />
                  <QuickCard emoji="🧠" title="Body Scan" subtitle="Guided body scan meditation" onClick={() => navigate("/coach", { state: { autoSend: "Guide me through a body scan meditation" } })} />
                  <QuickCard emoji="🌄" title="Visualization" subtitle="Guided visualization exercise" onClick={() => navigate("/coach", { state: { autoSend: "Try a visualization exercise with me" } })} />
                  <QuickCard emoji="🎧" title="Guided Meditation" subtitle="Calming guided meditation session" onClick={() => navigate("/coach", { state: { autoSend: "Try a guided meditation with me" } })} />
                  <QuickCard emoji="🤸" title="Stretching Routine" subtitle="Gentle stretching for flexibility" onClick={() => navigate("/coach", { state: { autoSend: "Try a gentle stretching routine" } })} />
                </CollapsibleContent>
              </Collapsible>
              {groundTotal > 0 && (
                <div
                  onClick={() => navigate("/nervous-system")}
                  className="flex items-center gap-3 card-base cursor-pointer transition-all hover:bg-secondary/50 active:scale-[0.98]"
                >
                  <span className="text-xl">🌿</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Grounding Streak</p>
                    <p className="text-xs text-muted-foreground">
                      {groundStreak > 0
                        ? `${groundStreak} day${groundStreak !== 1 ? "s" : ""} in a row · ${groundTotal} total`
                        : `${groundTotal} session${groundTotal !== 1 ? "s" : ""} completed`}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-primary">
                    {groundStreak > 0 ? `🔥 ${groundStreak}` : "Start today"}
                  </span>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </StaggerItem>

        {/* Section: Quick Actions — collapsed by default */}
        <StaggerItem>
          <Collapsible>
            <CollapsibleTrigger className="flex w-full items-center justify-between card-base text-left group">
              <p className="section-label">⚡ Quick Actions</p>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              <div data-tour="reminders" className="space-y-2">
                <QuickCard emoji="💊" title="Medications" subtitle="Manage your medications" onClick={() => navigate("/medications")} />
                <QuickCard emoji="📅" title="Appointments" subtitle="View & manage appointments" onClick={() => navigate("/appointments")} />
                <button
                  onClick={() => setShowReportPreview(true)}
                  disabled={downloadingReport}
                  className="flex w-full items-center gap-3 card-base text-left transition-all hover:bg-secondary/50 active:scale-[0.98] disabled:opacity-60"
                >
                  <span className="text-base">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Download Report</p>
                    <p className="text-xs text-muted-foreground">{downloadingReport ? "Generating…" : "Last 30 days · PDF"}</p>
                  </div>
                  <FileDown className="h-4 w-4 text-muted-foreground" />
                </button>
                <ReportPreviewDialog
                  open={showReportPreview}
                  onOpenChange={setShowReportPreview}
                  onConfirm={() => { setShowReportPreview(false); handleDownloadReport(); }}
                  generating={downloadingReport}
                  startDate={report30Start}
                  endDate={report30End}
                  entries={report30Entries}
                  profile={profile || null}
                  medications={reportMeds}
                  medLogs={reportMedLogs}
                  appointments={reportAppts.filter((a) => a.date >= report30Start && a.date <= report30End)}
                  relapses={reportRelapses}
                  sections={{
                    includeProfile: true, includeSymptoms: true, includeMedications: true,
                    includeAppointments: true, includeNotes: true, includeRelapses: true,
                    includeHydration: true, includeRiskScore: true, includeTrendCharts: true,
                    includeMoodTags: true, includePeriodComparison: true, includeTriggerAnalysis: true,
                    includeAiInsight: false,
                  }}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </StaggerItem>

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
      </StaggerContainer>


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
