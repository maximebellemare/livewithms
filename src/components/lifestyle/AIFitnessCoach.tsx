import { useState, useEffect, useCallback } from "react";
import { Dumbbell, Loader2, Sparkles, ChevronLeft, RotateCcw, Save, Check, Trash2, ChevronDown, ChevronUp, ClipboardList, MessageCircle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ExerciseLog } from "@/hooks/useLifestyleTracking";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import FitnessCoachChat from "./FitnessCoachChat";
import ExerciseDetailSheet from "./ExerciseDetailSheet";

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
  { label: "Tai Chi", emoji: "🥋" },
  { label: "Dancing", emoji: "💃" },
  { label: "Hiking", emoji: "🥾" },
  { label: "Stair climbing", emoji: "🪜" },
  { label: "Elliptical", emoji: "🔄" },
  { label: "Rowing", emoji: "🚣" },
  { label: "Bodyweight exercises", emoji: "🫃" },
  { label: "Aqua aerobics", emoji: "🌊" },
  { label: "Balance training", emoji: "⚖️" },
  { label: "Light gardening", emoji: "🌿" },
  { label: "Foam rolling", emoji: "🧴" },
  { label: "Boxing/Kickboxing", emoji: "🥊" },
  { label: "Jump rope", emoji: "🪢" },
  { label: "TRX / Suspension", emoji: "🔗" },
];

const DURATION_OPTIONS = [
  { label: "15 min", value: "15min" },
  { label: "30 min", value: "30min" },
  { label: "45 min", value: "45min" },
  { label: "1 hour", value: "60min" },
  { label: "1.5 hours", value: "90min" },
  { label: "2 hours", value: "120min" },
];

const FREQUENCY_OPTIONS = [
  { label: "1× / week", value: "1x_week" },
  { label: "2-3× / week", value: "2-3x_week" },
  { label: "3-4× / week", value: "3-4x_week" },
  { label: "4-5× / week", value: "4-5x_week" },
  { label: "5-6× / week", value: "5-6x_week" },
  { label: "Every day", value: "7x_week" },
];

const FITNESS_LEVELS = [
  { label: "Beginner", value: "beginner", desc: "New to exercise or returning after a long break" },
  { label: "Intermediate", value: "intermediate", desc: "Exercise regularly, comfortable with most movements" },
  { label: "Advanced", value: "advanced", desc: "Very active, looking for challenging workouts" },
];

const EQUIPMENT_OPTIONS = [
  { label: "None", emoji: "🚫" },
  { label: "Dumbbells", emoji: "🏋️" },
  { label: "Resistance bands", emoji: "🔴" },
  { label: "Yoga mat", emoji: "🧘" },
  { label: "Pull-up bar", emoji: "🪜" },
  { label: "Kettlebell", emoji: "🔔" },
  { label: "Exercise ball", emoji: "⚽" },
  { label: "Foam roller", emoji: "🧴" },
  { label: "Jump rope", emoji: "🪢" },
  { label: "Bench", emoji: "🪑" },
  { label: "TRX straps", emoji: "🔗" },
  { label: "Full gym", emoji: "🏢" },
];

const TIME_OF_DAY_OPTIONS = [
  { label: "Early morning", value: "early_morning", emoji: "🌅" },
  { label: "Morning", value: "morning", emoji: "☀️" },
  { label: "Afternoon", value: "afternoon", emoji: "🌤️" },
  { label: "Evening", value: "evening", emoji: "🌇" },
  { label: "Flexible", value: "flexible", emoji: "🔄" },
];

interface WorkoutExercise {
  name: string;
  sets?: string;
  reps?: string;
  rest?: string;
  instruction?: string;
  steps?: string[];
  muscle_group?: string;
}

interface DaySchedule {
  day: string;
  workout_name: string;
  duration: string;
  exercises: WorkoutExercise[];
  warmup: string;
  cooldown: string;
  notes: string;
}

interface TrainingPlan {
  overview: string;
  weekly_schedule: DaySchedule[];
  tips: string[];
  progression: string;
  caution: string | null;
}

interface SavedPlan {
  id: string;
  title: string;
  created_at: string;
  is_active: boolean;
  plan_data: TrainingPlan;
  goals: string[];
}

type Step = "home" | "goals" | "abilities" | "details" | "result";

// Pill button helper
function Pill({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
        selected ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

export default function AIFitnessCoach({ exerciseLogs, symptomEntries, msType }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("home");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedAbilities, setSelectedAbilities] = useState<string[]>([]);
  const [sessionDuration, setSessionDuration] = useState("");
  const [weeklyFrequency, setWeeklyFrequency] = useState("");
  const [fitnessLevel, setFitnessLevel] = useState("beginner");
  const [hasGym, setHasGym] = useState<boolean | null>(null);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [limitations, setLimitations] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
  const [viewingSavedPlan, setViewingSavedPlan] = useState<SavedPlan | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<WorkoutExercise | null>(null);

  const toggleItem = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  // Load saved plans
  const loadSavedPlans = useCallback(async () => {
    if (!user) return;
    setLoadingPlans(true);
    const { data } = await (supabase
      .from("fitness_plans") as any)
      .select("id, title, created_at, is_active, plan_data, goals")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setSavedPlans(data as unknown as SavedPlan[]);
    setLoadingPlans(false);
  }, [user]);

  useEffect(() => { loadSavedPlans(); }, [loadSavedPlans]);

  // Load today's completed workouts for active plan
  const loadCompletedDays = useCallback(async (planId: string) => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const { data } = await (supabase
      .from("fitness_workout_logs") as any)
      .select("day_name")
      .eq("user_id", user.id)
      .eq("plan_id", planId)
      .gte("completed_at", today + "T00:00:00");
    if (data) setCompletedDays(new Set(data.map((d) => d.day_name)));
  }, [user]);

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
            sessionDuration,
            weeklyFrequency,
            fitnessLevel,
            hasGym,
            equipment,
            limitations,
            preferredTime,
            additionalNotes,
          },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPlan(data);
      setStep("result");
      setViewingSavedPlan(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async () => {
    if (!user || !plan) return;
    setSaving(true);
    try {
      // Deactivate other plans
      await (supabase.from("fitness_plans") as any).update({ is_active: false }).eq("user_id", user.id);

      const title = selectedGoals.slice(0, 2).join(" & ") || "My Training Plan";
      const { error } = await (supabase.from("fitness_plans") as any).insert({
        user_id: user.id,
        title,
        goals: selectedGoals,
        abilities: selectedAbilities,
        session_duration: sessionDuration,
        weekly_frequency: weeklyFrequency,
        fitness_level: fitnessLevel,
        has_gym: hasGym ?? false,
        equipment,
        limitations,
        preferred_time_of_day: preferredTime,
        plan_data: plan,
        is_active: true,
      });
      if (error) throw error;
      toast.success("Plan saved! Track your workouts from the home screen.");
      loadSavedPlans();
    } catch (e: any) {
      toast.error(e.message || "Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async (id: string) => {
    if (!user) return;
    await (supabase.from("fitness_plans") as any).delete().eq("id", id).eq("user_id", user.id);
    setSavedPlans((prev) => prev.filter((p) => p.id !== id));
    if (viewingSavedPlan?.id === id) {
      setViewingSavedPlan(null);
      setStep("home");
    }
    toast.success("Plan deleted");
  };

  const markDayComplete = async (planId: string, dayName: string) => {
    if (!user) return;
    if (completedDays.has(dayName)) return;
    await (supabase.from("fitness_workout_logs") as any).insert({
      user_id: user.id,
      plan_id: planId,
      day_name: dayName,
    });
    setCompletedDays((prev) => new Set(prev).add(dayName));
    toast.success(`${dayName} workout done! 💪`);
  };

  const viewSavedPlan = (sp: SavedPlan) => {
    setViewingSavedPlan(sp);
    setPlan(sp.plan_data);
    setStep("result");
    loadCompletedDays(sp.id);
  };

  const reset = () => {
    setStep("goals");
    setSelectedGoals([]);
    setSelectedAbilities([]);
    setSessionDuration("");
    setWeeklyFrequency("");
    setFitnessLevel("beginner");
    setHasGym(null);
    setEquipment([]);
    setLimitations("");
    setPreferredTime("");
    setAdditionalNotes("");
    setPlan(null);
    setViewingSavedPlan(null);
    setExpandedDay(null);
  };

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
      <div className="flex items-center gap-2">
        <Dumbbell className="h-4 w-4 text-primary" />
        <h3 className="font-display text-sm font-semibold text-foreground">AI Fitness Coach</h3>
      </div>

      {/* Home: saved plans + create new */}
      {step === "home" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Get a personalized training plan tailored to your MS, goals, and lifestyle.</p>

          <button
            onClick={() => { reset(); setStep("goals"); }}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5" /> Create New Plan
          </button>

          {loadingPlans ? (
            <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
          ) : savedPlans.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1">
                <ClipboardList className="h-3.5 w-3.5" /> Saved Plans
              </h4>
              {savedPlans.map((sp) => (
                <div key={sp.id} className="rounded-lg bg-secondary/50 p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <button onClick={() => viewSavedPlan(sp)} className="text-xs font-semibold text-foreground hover:text-primary text-left flex-1">
                      {sp.title}
                      {sp.is_active && <span className="ml-1.5 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Active</span>}
                    </button>
                    <button onClick={() => deletePlan(sp.id)} className="text-muted-foreground hover:text-destructive p-1">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {sp.goals.slice(0, 3).join(", ")} · {new Date(sp.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step: Goals */}
      {step === "goals" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setStep("home")} className="text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /></button>
            <p className="text-xs text-muted-foreground">What are your fitness goals?</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {GOAL_OPTIONS.map((g) => (
              <Pill key={g.label} selected={selectedGoals.includes(g.label)} onClick={() => toggleItem(selectedGoals, g.label, setSelectedGoals)}>
                <span>{g.emoji}</span> {g.label}
              </Pill>
            ))}
          </div>
          <button onClick={() => setStep("abilities")} disabled={selectedGoals.length === 0}
            className="w-full rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-all">
            Next →
          </button>
        </div>
      )}

      {/* Step: Abilities */}
      {step === "abilities" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setStep("goals")} className="text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /></button>
            <p className="text-xs text-muted-foreground">What exercises can you do comfortably?</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ABILITY_OPTIONS.map((a) => (
              <Pill key={a.label} selected={selectedAbilities.includes(a.label)} onClick={() => toggleItem(selectedAbilities, a.label, setSelectedAbilities)}>
                <span>{a.emoji}</span> {a.label}
              </Pill>
            ))}
          </div>
          <button onClick={() => setStep("details")} disabled={selectedAbilities.length === 0}
            className="w-full rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-all">
            Next →
          </button>
        </div>
      )}

      {/* Step: Details */}
      {step === "details" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setStep("abilities")} className="text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /></button>
            <p className="text-xs text-muted-foreground">Tell us more about you</p>
          </div>

          {/* Fitness Level */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Fitness level</label>
            <div className="space-y-1">
              {FITNESS_LEVELS.map((fl) => (
                <button key={fl.value} onClick={() => setFitnessLevel(fl.value)}
                  className={`w-full text-left rounded-lg px-3 py-2 transition-all ${
                    fitnessLevel === fl.value ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-foreground hover:bg-muted"
                  }`}>
                  <span className="text-xs font-semibold">{fl.label}</span>
                  <p className={`text-[10px] ${fitnessLevel === fl.value ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{fl.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Session Duration */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Session duration</label>
            <div className="flex flex-wrap gap-1.5">
              {DURATION_OPTIONS.map((d) => (
                <Pill key={d.value} selected={sessionDuration === d.value} onClick={() => setSessionDuration(d.value)}>
                  {d.label}
                </Pill>
              ))}
            </div>
          </div>

          {/* Weekly Frequency */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">How often per week?</label>
            <div className="flex flex-wrap gap-1.5">
              {FREQUENCY_OPTIONS.map((f) => (
                <Pill key={f.value} selected={weeklyFrequency === f.value} onClick={() => setWeeklyFrequency(f.value)}>
                  {f.label}
                </Pill>
              ))}
            </div>
          </div>

          {/* Gym Access */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Gym access?</label>
            <div className="flex gap-2">
              {[{ label: "🏢 Yes, gym", val: true }, { label: "🏠 No, home only", val: false }].map((opt) => (
                <button key={String(opt.val)} onClick={() => setHasGym(opt.val)}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                    hasGym === opt.val ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary text-foreground hover:bg-muted"
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment at home */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Equipment available</label>
            <div className="flex flex-wrap gap-1.5">
              {EQUIPMENT_OPTIONS.map((e) => (
                <Pill key={e.label} selected={equipment.includes(e.label)} onClick={() => toggleItem(equipment, e.label, setEquipment)}>
                  <span>{e.emoji}</span> {e.label}
                </Pill>
              ))}
            </div>
          </div>

          {/* Preferred time of day */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Preferred workout time</label>
            <div className="flex flex-wrap gap-1.5">
              {TIME_OF_DAY_OPTIONS.map((t) => (
                <Pill key={t.value} selected={preferredTime === t.value} onClick={() => setPreferredTime(t.value)}>
                  <span>{t.emoji}</span> {t.label}
                </Pill>
              ))}
            </div>
          </div>

          {/* Limitations / injuries */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Injuries or limitations (optional)</label>
            <Textarea value={limitations} onChange={(e) => setLimitations(e.target.value)}
              placeholder="E.g. bad knees, lower back pain, limited grip strength…"
              className="min-h-[50px] text-xs" maxLength={300} />
          </div>

          {/* Additional notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Anything else? (optional)</label>
            <Textarea value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="E.g. I get fatigued in heat, prefer low-impact, training for an event…"
              className="min-h-[50px] text-xs" maxLength={500} />
          </div>

          <button onClick={generate}
            disabled={loading || !sessionDuration || !weeklyFrequency || hasGym === null}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-all">
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
            {plan.weekly_schedule.map((day, i) => {
              const isExpanded = expandedDay === i;
              const isDone = completedDays.has(day.day);
              const activePlanId = viewingSavedPlan?.id;

              return (
                <div key={i} className={`rounded-lg p-2.5 space-y-1 transition-all ${isDone ? "bg-primary/10 border border-primary/20" : "bg-primary/5"}`}>
                  <button onClick={() => setExpandedDay(isExpanded ? null : i)} className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isDone && <Check className="h-3.5 w-3.5 text-primary" />}
                      <span className={`text-xs font-semibold ${isDone ? "text-primary" : "text-foreground"}`}>{day.day}</span>
                      <span className="text-[10px] text-muted-foreground">{day.workout_name || day.duration}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">{day.duration}</span>
                      {isExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="space-y-2 pt-1.5 border-t border-border/50 mt-1.5">
                      {/* Warmup */}
                      {day.warmup && (
                        <div className="text-[10px] text-muted-foreground">
                          <span className="font-semibold text-foreground">🔥 Warm-up:</span> {day.warmup}
                        </div>
                      )}

                      {/* Exercises with sets/reps */}
                      {day.exercises?.length > 0 && (
                        <div className="space-y-1.5">
                          {day.exercises.map((ex, j) => (
                            <button
                              key={j}
                              onClick={() => setSelectedExercise(ex)}
                              className="w-full text-left rounded-md bg-background/50 p-2 space-y-0.5 hover:bg-background/80 transition-colors group"
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-foreground">{ex.name}</p>
                                <Info className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                              </div>
                              {(ex.sets || ex.reps || ex.rest) && (
                                <div className="flex gap-2 text-[10px] text-muted-foreground">
                                  {ex.sets && <span>{ex.sets} sets</span>}
                                  {ex.reps && <span>· {ex.reps}</span>}
                                  {ex.rest && <span>· Rest: {ex.rest}</span>}
                                </div>
                              )}
                              {ex.instruction && <p className="text-[10px] text-muted-foreground italic">{ex.instruction}</p>}
                              {ex.steps && ex.steps.length > 0 && (
                                <p className="text-[10px] text-primary font-medium mt-0.5">Tap for step-by-step guide →</p>
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Cooldown */}
                      {day.cooldown && (
                        <div className="text-[10px] text-muted-foreground">
                          <span className="font-semibold text-foreground">❄️ Cool-down:</span> {day.cooldown}
                        </div>
                      )}

                      {/* Notes */}
                      {day.notes && <p className="text-[10px] text-muted-foreground italic">💡 {day.notes}</p>}

                      {/* Mark complete */}
                      {activePlanId && !isDone && (
                        <button onClick={() => markDayComplete(activePlanId, day.day)}
                          className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[10px] font-semibold text-primary-foreground hover:opacity-90 transition-all">
                          <Check className="h-3 w-3" /> Mark as Done
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
            <div className="rounded-lg bg-destructive/10 px-3 py-2">
              <p className="text-xs text-destructive">⚠️ {plan.caution}</p>
            </div>
          )}

          {/* Coach Chat */}
          <FitnessCoachChat
            planContext={plan}
            exerciseLogs={exerciseLogs}
            symptomEntries={symptomEntries}
            msType={msType}
          />

          <div className="flex flex-wrap gap-2">
            {!viewingSavedPlan && (
              <button onClick={savePlan} disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-all">
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                {saving ? "Saving…" : "Save Plan"}
              </button>
            )}
            {!viewingSavedPlan && (
              <button onClick={generate} disabled={loading}
                className="inline-flex items-center justify-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-all">
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Regenerate
              </button>
            )}
            <button onClick={() => { setStep("home"); setViewingSavedPlan(null); setPlan(null); }}
              className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:bg-muted transition-all">
              <RotateCcw className="h-3 w-3" /> {viewingSavedPlan ? "Back" : "Start Over"}
            </button>
          </div>
        </div>
      )}

      {/* Exercise Detail Sheet */}
      <ExerciseDetailSheet
        exercise={selectedExercise}
        onClose={() => setSelectedExercise(null)}
        msType={msType}
      />
    </div>
  );
}
