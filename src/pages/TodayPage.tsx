import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import SymptomSlider from "@/components/SymptomSlider";
import MoodSelector from "@/components/MoodSelector";
import QuickCard from "@/components/QuickCard";
import WeeklySummaryBanner from "@/components/WeeklySummaryBanner";
import StreakBadge from "@/components/StreakBadge";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import MedicationChecklist from "@/components/MedicationChecklist";
import UpcomingAppointments from "@/components/UpcomingAppointments";
import { useSaveEntry } from "@/hooks/useEntries";
import { toast } from "sonner";

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

  const saveEntry = useSaveEntry();

  const toggleMoodTag = (tag: string) => {
    setMoodTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleLog = async () => {
    try {
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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
            <span className="text-3xl">🧡</span>
          </div>
          <h2 className="font-display text-2xl font-semibold text-foreground">Logged!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Great job taking care of yourself today. Every entry helps you understand your MS better.
          </p>
          <div className="mt-5 mx-auto max-w-xs">
            <StreakBadge />
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
        {/* Weekly summary banner */}
        <WeeklySummaryBanner />

        {/* Streak tracker */}
        <StreakBadge />

        {/* Quick symptom logging */}
        <div className="space-y-3 animate-fade-in">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Quick Log
          </p>
          <SymptomSlider label="Fatigue" emoji="🔋" value={fatigue} onChange={setFatigue} />
          <SymptomSlider label="Pain" emoji="⚡" value={pain} onChange={setPain} />
          <SymptomSlider label="Brain Fog" emoji="🌫️" value={brainFog} onChange={setBrainFog} />
          <SymptomSlider label="Mood" emoji="😊" value={mood} onChange={setMood} />
          <SymptomSlider label="Mobility" emoji="🚶" value={mobility} onChange={setMobility} />
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

          <div className="rounded-xl bg-card p-4 shadow-soft">
            <label className="mb-2 block text-sm font-medium text-foreground">
              📝 Notes
            </label>
            <textarea
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
            {saveEntry.isPending ? "Saving..." : "Save today's entry"}
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
