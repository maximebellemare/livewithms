import { useState, useMemo } from "react";
import { format } from "date-fns";
import SEOHead from "@/components/SEOHead";
import PageHeader from "@/components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Check, Trash2, Dumbbell, Pill, Salad, Scale, Minus } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import {
  useExerciseLogs, useAddExercise, useDeleteExercise,
  useSupplementLogs, useAddSupplement, useToggleSupplement,
  useDietGoals, useAddDietGoal, useDeleteDietGoal, useDietGoalLogs, useToggleDietGoalLog,
  useWeightLogs, useAddWeight,
} from "@/hooks/useLifestyleTracking";

const EXERCISE_TYPES = ["Walking", "Swimming", "Yoga", "Stretching", "Cycling", "Strength Training", "Pilates", "Tai Chi", "Other"];
const INTENSITIES = ["light", "moderate", "vigorous"];
const COMMON_SUPPLEMENTS = ["Vitamin D", "Vitamin B12", "Omega-3", "Magnesium", "Biotin", "Probiotics", "CoQ10", "Turmeric"];
const DIET_PRESETS = ["Anti-inflammatory diet", "Mediterranean diet", "Low sodium", "High fiber", "Gluten-free", "Eat more vegetables", "Limit sugar", "Drink more water"];

const today = format(new Date(), "yyyy-MM-dd");

const LifestylePage = () => {
  const [activeTab, setActiveTab] = useState("exercise");

  return (
    <>
      <SEOHead title="Lifestyle" description="Track exercise, supplements, diet goals, and weight." />
      <PageHeader title="Lifestyle" subtitle="Track your daily wellness habits 🏋️" />
      <div className="mx-auto max-w-lg px-4 py-4 animate-fade-in">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="exercise" className="text-xs"><Dumbbell className="h-3.5 w-3.5 mr-1" />Exercise</TabsTrigger>
            <TabsTrigger value="supplements" className="text-xs"><Pill className="h-3.5 w-3.5 mr-1" />Supps</TabsTrigger>
            <TabsTrigger value="diet" className="text-xs"><Salad className="h-3.5 w-3.5 mr-1" />Diet</TabsTrigger>
            <TabsTrigger value="weight" className="text-xs"><Scale className="h-3.5 w-3.5 mr-1" />Weight</TabsTrigger>
          </TabsList>

          <TabsContent value="exercise" className="mt-4 space-y-4"><ExerciseTab /></TabsContent>
          <TabsContent value="supplements" className="mt-4 space-y-4"><SupplementsTab /></TabsContent>
          <TabsContent value="diet" className="mt-4 space-y-4"><DietTab /></TabsContent>
          <TabsContent value="weight" className="mt-4 space-y-4"><WeightTab /></TabsContent>
        </Tabs>
      </div>
    </>
  );
};

// ── Exercise Tab ──
function ExerciseTab() {
  const { data: logs = [] } = useExerciseLogs();
  const addExercise = useAddExercise();
  const deleteExercise = useDeleteExercise();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("Walking");
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState("moderate");
  const [notes, setNotes] = useState("");

  const handleAdd = async () => {
    try {
      await addExercise.mutateAsync({ date: today, type, duration_minutes: duration, intensity, notes: notes || null });
      toast.success("Exercise logged!");
      setShowForm(false);
      setNotes("");
    } catch { toast.error("Failed to log exercise"); }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foreground">Exercise Log</h3>
        <button onClick={() => setShowForm(!showForm)} className="rounded-full bg-primary p-1.5 text-primary-foreground shadow-soft hover:opacity-90 active:scale-95 transition-all">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                {EXERCISE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">Duration (min)</label>
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => setDuration(Math.max(5, duration - 5))} className="rounded bg-secondary p-1 hover:bg-muted"><Minus className="h-3 w-3" /></button>
                    <span className="text-sm font-semibold min-w-[3ch] text-center">{duration}</span>
                    <button onClick={() => setDuration(Math.min(240, duration + 5))} className="rounded bg-secondary p-1 hover:bg-muted"><Plus className="h-3 w-3" /></button>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground">Intensity</label>
                  <div className="flex gap-1 mt-1">
                    {INTENSITIES.map((i) => (
                      <button key={i} onClick={() => setIntensity(i)} className={`rounded-full px-2 py-1 text-xs capitalize transition-all ${intensity === i ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-muted"}`}>
                        {i}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" maxLength={200} />
              <button onClick={handleAdd} disabled={addExercise.isPending} className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
                {addExercise.isPending ? "Saving…" : "Log Exercise"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No exercises logged yet. Tap + to get started.</p>
      ) : (
        <div className="space-y-2">
          {logs.slice(0, 20).map((log) => (
            <div key={log.id} className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-soft">
              <Dumbbell className="h-4 w-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{log.type}</p>
                <p className="text-xs text-muted-foreground">{log.duration_minutes} min · {log.intensity} · {format(new Date(log.date + "T12:00:00"), "MMM d")}</p>
              </div>
              <button onClick={() => deleteExercise.mutate(log.id)} className="text-muted-foreground hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Supplements Tab ──
function SupplementsTab() {
  const { data: logs = [] } = useSupplementLogs(today);
  const addSupplement = useAddSupplement();
  const toggleSupplement = useToggleSupplement();
  const [showAdd, setShowAdd] = useState(false);
  const [customName, setCustomName] = useState("");

  const handleAddPreset = async (name: string) => {
    if (logs.some((l) => l.name === name)) { toast.error("Already added today"); return; }
    try {
      await addSupplement.mutateAsync({ date: today, name, taken: false });
    } catch { toast.error("Failed to add supplement"); }
  };

  const handleAddCustom = async () => {
    if (!customName.trim()) return;
    try {
      await addSupplement.mutateAsync({ date: today, name: customName.trim(), taken: false });
      setCustomName("");
      setShowAdd(false);
    } catch { toast.error("Failed to add supplement"); }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foreground">Today's Supplements</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="rounded-full bg-primary p-1.5 text-primary-foreground shadow-soft hover:opacity-90 active:scale-95 transition-all">
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {showAdd && (
        <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
          <p className="text-xs text-muted-foreground">Quick add:</p>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_SUPPLEMENTS.map((s) => (
              <button key={s} onClick={() => handleAddPreset(s)} className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs text-foreground hover:bg-muted active:scale-95 transition-all">{s}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Custom supplement" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" maxLength={50} />
            <button onClick={handleAddCustom} disabled={!customName.trim()} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">Add</button>
          </div>
        </div>
      )}

      {logs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No supplements tracked today.</p>
      ) : (
        <div className="space-y-1.5">
          {logs.map((log) => (
            <div key={log.id} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${log.taken ? "bg-primary/8" : "bg-secondary"}`}>
              <button
                onClick={() => toggleSupplement.mutate({ id: log.id, taken: !log.taken })}
                className={`flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${log.taken ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40 hover:border-primary"}`}
              >
                {log.taken && <Check className="h-3 w-3" />}
              </button>
              <span className={`text-sm ${log.taken ? "line-through text-muted-foreground" : "text-foreground"}`}>{log.name}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Diet Tab ──
function DietTab() {
  const { data: goals = [] } = useDietGoals();
  const { data: goalLogs = [] } = useDietGoalLogs(today);
  const addGoal = useAddDietGoal();
  const deleteGoal = useDeleteDietGoal();
  const toggleLog = useToggleDietGoalLog();
  const [showAdd, setShowAdd] = useState(false);
  const [customGoal, setCustomGoal] = useState("");

  const handleAddPreset = async (name: string) => {
    if (goals.some((g) => g.name === name)) { toast.error("Already have this goal"); return; }
    try { await addGoal.mutateAsync({ name }); } catch { toast.error("Failed to add goal"); }
  };

  const handleAddCustom = async () => {
    if (!customGoal.trim()) return;
    try { await addGoal.mutateAsync({ name: customGoal.trim() }); setCustomGoal(""); setShowAdd(false); } catch { toast.error("Failed to add goal"); }
  };

  const isCompleted = (goalId: string) => goalLogs.some((l) => l.goal_id === goalId && l.completed);

  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-foreground">Diet Goals</h3>
        <button onClick={() => setShowAdd(!showAdd)} className="rounded-full bg-primary p-1.5 text-primary-foreground shadow-soft hover:opacity-90 active:scale-95 transition-all"><Plus className="h-4 w-4" /></button>
      </div>

      {showAdd && (
        <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
          <p className="text-xs text-muted-foreground">Suggested goals:</p>
          <div className="flex flex-wrap gap-1.5">
            {DIET_PRESETS.map((d) => <button key={d} onClick={() => handleAddPreset(d)} className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs text-foreground hover:bg-muted active:scale-95 transition-all">{d}</button>)}
          </div>
          <div className="flex gap-2">
            <input type="text" value={customGoal} onChange={(e) => setCustomGoal(e.target.value)} placeholder="Custom goal" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" maxLength={80} />
            <button onClick={handleAddCustom} disabled={!customGoal.trim()} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">Add</button>
          </div>
        </div>
      )}

      {goals.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No diet goals set yet.</p>
      ) : (
        <div className="space-y-1.5">
          {goals.map((goal) => {
            const done = isCompleted(goal.id);
            return (
              <div key={goal.id} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${done ? "bg-primary/8" : "bg-secondary"}`}>
                <button
                  onClick={() => toggleLog.mutate({ goal_id: goal.id, date: today, completed: !done })}
                  className={`flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${done ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40 hover:border-primary"}`}
                >
                  {done && <Check className="h-3 w-3" />}
                </button>
                <span className={`flex-1 text-sm ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>{goal.name}</span>
                <button onClick={() => deleteGoal.mutate(goal.id)} className="text-muted-foreground hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ── Weight Tab ──
function WeightTab() {
  const { data: logs = [] } = useWeightLogs(90);
  const addWeight = useAddWeight();
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState("kg");

  const handleAdd = async () => {
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) { toast.error("Enter a valid weight"); return; }
    try {
      await addWeight.mutateAsync({ date: today, weight: w, unit });
      toast.success("Weight logged!");
      setWeight("");
    } catch { toast.error("Failed to log weight"); }
  };

  const chartData = useMemo(() => logs.map((l) => ({
    date: format(new Date(l.date + "T12:00:00"), "MMM d"),
    weight: Number(l.weight),
  })), [logs]);

  return (
    <>
      <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
        <h3 className="font-display text-sm font-semibold text-foreground">Log Weight</h3>
        <div className="flex gap-2">
          <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Weight" step="0.1" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <select value={unit} onChange={(e) => setUnit(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option value="kg">kg</option>
            <option value="lbs">lbs</option>
          </select>
          <button onClick={handleAdd} disabled={addWeight.isPending} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">Log</button>
        </div>
      </div>

      {chartData.length >= 2 && (
        <div className="rounded-xl bg-card p-4 shadow-soft">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">Weight Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} width={40} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {logs.length > 0 && (
        <div className="rounded-xl bg-card p-4 shadow-soft">
          <h3 className="font-display text-sm font-semibold text-foreground mb-2">Recent Entries</h3>
          <div className="space-y-1">
            {logs.slice(-10).reverse().map((l) => (
              <div key={l.id} className="flex items-center justify-between text-sm py-1">
                <span className="text-muted-foreground">{format(new Date(l.date + "T12:00:00"), "MMM d, yyyy")}</span>
                <span className="font-medium text-foreground">{Number(l.weight)} {l.unit}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default LifestylePage;
