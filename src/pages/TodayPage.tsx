import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { subDays, format, startOfWeek } from "date-fns";
import PageHeader from "@/components/PageHeader";
import SymptomSlider from "@/components/SymptomSlider";
import MoodSelector from "@/components/MoodSelector";
import QuickCard from "@/components/QuickCard";
import WeeklySummaryBanner from "@/components/WeeklySummaryBanner";
import StreakBadge, { useStreak } from "@/components/StreakBadge";
import WeekStreakBadge from "@/components/WeekStreakBadge";
import MondayRecapCard from "@/components/MondayRecapCard";
import StreakMilestoneBanner from "@/components/StreakMilestoneBanner";
import SymptomSparkline from "@/components/SymptomSparkline";
import { Link } from "react-router-dom";
import { Settings, CheckCircle2 } from "lucide-react";
import MedicationChecklist from "@/components/MedicationChecklist";
import UpcomingAppointments from "@/components/UpcomingAppointments";
import DailyPromptCard from "@/components/DailyPromptCard";
import { useSaveEntry, useEntriesInRange, useTodayEntry } from "@/hooks/useEntries";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

const MILESTONE_DAYS = [7, 14, 30];

/** Returns true if this streak number is a milestone we haven't celebrated yet */
function shouldCelebrate(streak: number): boolean {
  if (!MILESTONE_DAYS.includes(streak)) return false;
  const key = `milestone_celebrated_${streak}`;
  return !localStorage.getItem(key);
}

function markCelebrated(streak: number) {
  localStorage.setItem(`milestone_celebrated_${streak}`, "1");
}

const greetings = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const TodayPage = () => {
  const navigate = useNavigate();
  const [fatigue, setFatigue] = useState(0);
  const [pain, setPain] = useState(0);
  const [brainFog, setBrainFog] = useState(0);
  const [mood, setMood] = useState(0);
  const [mobility, setMobility] = useState(0);
  const [moodTags, setMoodTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [logged, setLogged] = useState(false);
  const [milestoneDismissed, setMilestoneDismissed] = useState(false);
  const [celebratedStreak, setCelebratedStreak] = useState<number | null>(null);
  const [formInitialized, setFormInitialized] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  // Read streak — used both before and after save
  const { streak } = useStreak();

  // After logging, if the new streak hits a milestone we haven't celebrated → show banner
  const isMilestone = celebratedStreak !== null
    ? MILESTONE_DAYS.includes(celebratedStreak) && !milestoneDismissed
    : MILESTONE_DAYS.includes(streak) && shouldCelebrate(streak) && !milestoneDismissed;

  const activeMilestoneStreak = celebratedStreak ?? streak;

  // Check if user already logged today
  const { data: todayEntry, isLoading: todayLoading } = useTodayEntry();
  const alreadyLogged = !!todayEntry && !logged;

  // Pre-populate form with today's existing entry (once loaded)
  useEffect(() => {
    if (todayEntry && !formInitialized) {
      setFatigue(todayEntry.fatigue ?? 0);
      setPain(todayEntry.pain ?? 0);
      setBrainFog(todayEntry.brain_fog ?? 0);
      setMood(todayEntry.mood ?? 0);
      setMobility(todayEntry.mobility ?? 0);
      setMoodTags(todayEntry.mood_tags ?? []);
      setNotes(todayEntry.notes ?? "");
      setSleepHours(todayEntry.sleep_hours != null ? String(todayEntry.sleep_hours) : "");
      setFormInitialized(true);
    }
  }, [todayEntry, formInitialized]);

  const today = new Date();
  const weekStart = format(subDays(today, 7), "yyyy-MM-dd");
  const weekEnd = format(subDays(today, 1), "yyyy-MM-dd");
  const { data: weekEntries = [] } = useEntriesInRange(weekStart, weekEnd);

  // Current calendar week (Mon → today) — used for goal completion detection
  const { data: profile } = useProfile();
  const thisWeekMonday = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const { data: thisWeekEntries = [] } = useEntriesInRange(thisWeekMonday, format(today, "yyyy-MM-dd"));

  const weekAvgs = useMemo(() => {
    const avg = (key: "fatigue" | "pain" | "brain_fog" | "mood" | "mobility") => {
      const vals = weekEntries.map((e) => e[key]).filter((v): v is number => v != null);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    return {
      fatigue: avg("fatigue"),
      pain: avg("pain"),
      brain_fog: avg("brain_fog"),
      mood: avg("mood"),
      mobility: avg("mobility"),
    };
  }, [weekEntries]);

  const saveEntry = useSaveEntry();

  const toggleMoodTag = (tag: string) => {
    setMoodTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleLog = async () => {
    try {
      // Snapshot goal state BEFORE saving so we can detect the crossing moment
      const goal = profile?.weekly_log_goal ?? 7;
      const countBefore = thisWeekEntries.length;
      // If already logged today, saving doesn't add a new entry to the count
      const countAfter = alreadyLogged ? countBefore : countBefore + 1;
      const goalJustReached = countAfter >= goal && countBefore < goal;
      const goalToastKey = `goal_toast_${thisWeekMonday}_${goal}`;

      await saveEntry.mutateAsync({
        date: new Date().toISOString().split("T")[0],
        fatigue,
        pain,
        brain_fog: brainFog,
        mood,
        mobility,
        mood_tags: moodTags,
        notes: notes || null,
        sleep_hours: sleepHours ? Number(sleepHours) : null,
      });

      // Show weekly goal toast exactly once per week
      if (goalJustReached && !localStorage.getItem(goalToastKey)) {
        localStorage.setItem(goalToastKey, "1");
        toast.success(`You hit your ${goal}-day goal this week! 🎉`, {
          description: "Amazing consistency — keep it up!",
          duration: 5000,
        });
      }

      // After saving, streak will increment by 1 (today wasn't logged yet)
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
          {/* Milestone banner — shown immediately after logging the milestone day */}
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
      <PageHeader
        title="Today"
        subtitle={greetings() + " 🧡"}
        action={
          <Link to="/profile" className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary">
            <Settings className="h-5 w-5" />
          </Link>
        }
      />
      <div className="mx-auto max-w-lg space-y-4 px-4 py-4">
        {/* Milestone celebration — shown at top when streak is at a milestone */}
        {isMilestone && (
          <StreakMilestoneBanner
            streak={activeMilestoneStreak}
            onDismiss={() => setMilestoneDismissed(true)}
          />
        )}

      {/* Already logged today indicator */}
        {!todayLoading && alreadyLogged && (
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/8 px-4 py-3 animate-fade-in">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Already logged today 🧡</p>
              <p className="text-xs text-muted-foreground">Your entry is saved — update it any time below.</p>
            </div>
          </div>
        )}

        {/* Monday weekly recap card */}
        <MondayRecapCard />

        {/* Weekly summary banner */}
        <WeeklySummaryBanner />

        {/* Streak trackers */}
        <StreakBadge />
        <WeekStreakBadge />

        {/* 7-day sparklines — mood, fatigue & pain at a glance */}
        <div className="grid grid-cols-3 gap-2">
          <SymptomSparkline entries={weekEntries} metric="mood" label="Mood" emoji="😊" higherIsBetter onClick={() => navigate("/insights", { state: { heatmapMetric: "mood" } })} />
          <SymptomSparkline entries={weekEntries} metric="fatigue" label="Fatigue" emoji="🔋" onClick={() => navigate("/insights", { state: { heatmapMetric: "fatigue" } })} />
          <SymptomSparkline entries={weekEntries} metric="pain" label="Pain" emoji="⚡" onClick={() => navigate("/insights", { state: { heatmapMetric: "pain" } })} />
        </div>
        <p className="text-[10px] text-muted-foreground text-center -mt-1">
          Tap a card to see insights →
        </p>

        {/* Quick symptom logging */}
        <div className="space-y-3 animate-fade-in">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Quick Log
          </p>
          <SymptomSlider label="Fatigue" emoji="🔋" value={fatigue} onChange={setFatigue} weekAvg={weekAvgs.fatigue} />
          <SymptomSlider label="Pain" emoji="⚡" value={pain} onChange={setPain} weekAvg={weekAvgs.pain} />
          <SymptomSlider label="Brain Fog" emoji="🌫️" value={brainFog} onChange={setBrainFog} weekAvg={weekAvgs.brain_fog} />
          <SymptomSlider label="Mood" emoji="😊" value={mood} onChange={setMood} weekAvg={weekAvgs.mood} higherIsBetter />
          <SymptomSlider label="Mobility" emoji="🚶" value={mobility} onChange={setMobility} weekAvg={weekAvgs.mobility} />
        </div>

        {/* Mood tags */}
        <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <MoodSelector selected={moodTags} onToggle={toggleMoodTag} />
        </div>

        {/* Sleep & Notes */}
        <div className="space-y-3 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="rounded-xl bg-card p-4 shadow-soft">
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

          {/* Daily reflection prompt */}
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

          <div className="rounded-xl bg-card p-4 shadow-soft">
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
        </div>

        {/* Medication checklist */}
        <div className="animate-slide-up" style={{ animationDelay: "0.25s" }}>
          <MedicationChecklist />
        </div>

        {/* Upcoming appointments */}
        <div className="animate-slide-up" style={{ animationDelay: "0.28s" }}>
          <UpcomingAppointments />
        </div>

        {/* Reminders */}
        <div className="space-y-2 animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Reminders
          </p>
          <QuickCard emoji="💊" title="Medications" subtitle="Manage your medications" onClick={() => navigate("/medications")} />
          <QuickCard emoji="📅" title="Appointments" subtitle="View & manage appointments" onClick={() => navigate("/appointments")} />
          <QuickCard emoji="💧" title="Hydration" subtitle="Stay hydrated — drink water!" accent />
        </div>

        {/* Log button */}
        <div className="pb-8 animate-slide-up" style={{ animationDelay: "0.4s" }}>
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
      </div>
    </>
  );
};

export default TodayPage;
