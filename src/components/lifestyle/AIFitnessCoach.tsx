import { useState } from "react";
import { Dumbbell, Loader2, Sparkles, ChevronLeft, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ExerciseLog } from "@/hooks/useLifestyleTracking";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  exerciseLogs: ExerciseLog[];
  symptomEntries: { date: string; fatigue: number | null; mood: number | null; pain: number | null }[];
  msType: string | null;
}

const GOAL_OPTIONS = [
  { label: "Lose weight", emoji: "🏃" },
  { label: "Build muscle", emoji: "💪" },
  { label: "Improve flexibility", emoji: "🧘" },
  { label: "Boost energy", emoji: "⚡" },
  { label: "Reduce stress", emoji: "🧠" },
  { label: "Improve balance", emoji: "⚖️" },
  { label: "Cardiovascular health", emoji: "❤️" },
  { label: "Pain management", emoji: "🩹" },
  { label: "Improve posture", emoji: "🧍" },
  { label: "Increase endurance", emoji: "🔋" },
  { label: "Tone body", emoji: "✨" },
  { label: "Better sleep", emoji: "😴" },
  { label: "Improve mobility", emoji: "🦿" },
  { label: "Reduce spasticity", emoji: "🫠" },
  { label: "Strengthen core", emoji: "🎯" },
  { label: "Rehab / recovery", emoji: "🏥" },
  { label: "Stay active at home", emoji: "🏠" },
  { label: "Social / group fitness", emoji: "👥" },
];

const ABILITY_OPTIONS = [
  { label: "Walking", emoji: "🚶" },
  { label: "Jogging/Running", emoji: "🏃" },
  { label: "Weightlifting", emoji: "🏋️" },
  { label: "Yoga", emoji: "🧘" },
  { label: "Swimming", emoji: "🏊" },
  { label: "Cycling", emoji: "🚴" },
  { label: "Stretching", emoji: "🤸" },
  { label: "Chair exercises", emoji: "🪑" },
  { label: "Resistance bands", emoji: "🔴" },
  { label: "Pilates", emoji: "🧎" },
];

const TIME_OPTIONS = [
  { label: "15 min/day", value: "15min_daily" },
  { label: "30 min/day", value: "30min_daily" },
  { label: "45 min/day", value: "45min_daily" },
  { label: "1 hour/day", value: "60min_daily" },
  { label: "2-3 days/week", value: "2-3_days_week" },
  { label: "4-5 days/week", value: "4-5_days_week" },
];

interface TrainingPlan {
  overview: string;
  weekly_schedule: { day: string; workout: string; duration: string; notes: string }[];
  tips: string[];
  progression: string;
  caution: string | null;
}

type Step = "goals" | "abilities" | "details" | "result";

export default function AIFitnessCoach({ exerciseLogs, symptomEntries, msType }: Props) {
  const [step, setStep] = useState<Step>("goals");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedAbilities, setSelectedAbilities] = useState<string[]>([]);
  const [timeAvailable, setTimeAvailable] = useState("");
  const [hasGym, setHasGym] = useState<boolean | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleItem = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("exercise-correlation", {
        body: {
          exerciseLogs: exerciseLogs.slice(0, 14).map((l) => ({
            date: l.date, type: l.type, duration: l.duration_minutes, intensity: l.intensity,
          })),
          symptomEntries: symptomEntries.slice(-7),
          msType,
          mode: "fitness_coach",
          coachInput: {
            goals: selectedGoals,
            abilities: selectedAbilities,
            timeAvailable,
            hasGym,
            additionalNotes,
          },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPlan(data);
      setStep("result");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("goals");
    setSelectedGoals([]);
    setSelectedAbilities([]);
    setTimeAvailable("");
    setHasGym(null);
    setAdditionalNotes("");
    setPlan(null);
  };

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
      <div className="flex items-center gap-2">
        <Dumbbell className="h-4 w-4 text-primary" />
        <h3 className="font-display text-sm font-semibold text-foreground">AI Fitness Coach</h3>
      </div>

      {/* Step: Goals */}
      {step === "goals" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">What are your fitness goals?</p>
          <div className="flex flex-wrap gap-1.5">
            {GOAL_OPTIONS.map((g) => (
              <button
                key={g.label}
                onClick={() => toggleItem(selectedGoals, g.label, setSelectedGoals)}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  selectedGoals.includes(g.label)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-foreground hover:bg-muted"
                }`}
              >
                <span>{g.emoji}</span> {g.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep("abilities")}
            disabled={selectedGoals.length === 0}
            className="w-full rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-all"
          >
            Next →
          </button>
        </div>
      )}

      {/* Step: Abilities */}
      {step === "abilities" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setStep("goals")} className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-xs text-muted-foreground">What exercises can you do comfortably?</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ABILITY_OPTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => toggleItem(selectedAbilities, a.label, setSelectedAbilities)}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  selectedAbilities.includes(a.label)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-foreground hover:bg-muted"
                }`}
              >
                <span>{a.emoji}</span> {a.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep("details")}
            disabled={selectedAbilities.length === 0}
            className="w-full rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-all"
          >
            Next →
          </button>
        </div>
      )}

      {/* Step: Details */}
      {step === "details" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setStep("abilities")} className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-xs text-muted-foreground">A few more details</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Time available</label>
            <div className="flex flex-wrap gap-1.5">
              {TIME_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTimeAvailable(t.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                    timeAvailable === t.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary text-foreground hover:bg-muted"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Do you have access to a gym?</label>
            <div className="flex gap-2">
              {[
                { label: "Yes, gym access", val: true },
                { label: "No, home only", val: false },
              ].map((opt) => (
                <button
                  key={String(opt.val)}
                  onClick={() => setHasGym(opt.val)}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                    hasGym === opt.val
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary text-foreground hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Anything else? (optional)</label>
            <Textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="E.g. I have knee issues, I prefer morning workouts, I get fatigued easily in the heat..."
              className="min-h-[60px] text-xs"
              maxLength={500}
            />
          </div>

          <button
            onClick={generate}
            disabled={loading || !timeAvailable || hasGym === null}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-all"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {loading ? "Creating your plan…" : "Generate My Plan"}
          </button>
        </div>
      )}

      {/* Step: Result */}
      {step === "result" && plan && (
        <div className="space-y-3">
          <p className="text-xs text-foreground leading-relaxed">{plan.overview}</p>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-foreground">📅 Weekly Schedule</h4>
            {plan.weekly_schedule.map((day, i) => (
              <div key={i} className="rounded-lg bg-primary/5 p-2.5 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">{day.day}</span>
                  <span className="text-[10px] text-muted-foreground">{day.duration}</span>
                </div>
                <p className="text-xs text-foreground">{day.workout}</p>
                {day.notes && <p className="text-[10px] text-muted-foreground italic">{day.notes}</p>}
              </div>
            ))}
          </div>

          {plan.tips.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-foreground">💡 Tips</h4>
              <ul className="space-y-1">
                {plan.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-foreground leading-relaxed">• {tip}</li>
                ))}
              </ul>
            </div>
          )}

          {plan.progression && (
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-foreground">📈 Progression</h4>
              <p className="text-xs text-foreground leading-relaxed">{plan.progression}</p>
            </div>
          )}

          {plan.caution && (
            <div className="rounded-lg bg-amber-500/10 px-3 py-2">
              <p className="text-xs text-amber-700 dark:text-amber-400">⚠️ {plan.caution}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={generate}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-all"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              Regenerate
            </button>
            <button
              onClick={reset}
              className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-all"
            >
              <RotateCcw className="h-3 w-3" /> Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
