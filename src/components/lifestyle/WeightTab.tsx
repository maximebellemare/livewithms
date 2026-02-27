import { useState, useMemo } from "react";
import { format, subDays, isAfter, parseISO } from "date-fns";
import { toast } from "sonner";
import { Scale, TrendingUp, TrendingDown, Minus, Target, Activity, Brain } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";
import { useWeightLogs, useAddWeight, WeightLog } from "@/hooks/useLifestyleTracking";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AIWeightInsights from "@/components/lifestyle/AIWeightInsights";

const today = format(new Date(), "yyyy-MM-dd");

export default function WeightTab() {
  const { data: logs = [] } = useWeightLogs(90);
  const addWeight = useAddWeight();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { user } = useAuth();
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState("kg");
  const [showSettings, setShowSettings] = useState(false);
  const [heightInput, setHeightInput] = useState("");
  const [goalInput, setGoalInput] = useState("");

  // Fetch daily entries for symptom correlation
  const { data: entries = [] } = useQuery({
    queryKey: ["daily-entries-weight-corr", user?.id],
    queryFn: async () => {
      const start = format(subDays(new Date(), 89), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("daily_entries")
        .select("date, fatigue, mood, pain, brain_fog")
        .eq("user_id", user!.id)
        .gte("date", start)
        .order("date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const handleAdd = async () => {
    const w = parseFloat(weight);
    if (isNaN(w) || w <= 0) { toast.error("Enter a valid weight"); return; }
    try {
      await addWeight.mutateAsync({ date: today, weight: w, unit });
      toast.success("Weight logged!");
      setWeight("");
    } catch { toast.error("Failed to log weight"); }
  };

  const handleSaveSettings = async () => {
    const h = heightInput ? parseFloat(heightInput) : null;
    const g = goalInput ? parseFloat(goalInput) : null;
    try {
      await updateProfile.mutateAsync({
        height_cm: h,
        goal_weight: g,
        goal_weight_unit: unit,
      } as any);
      toast.success("Settings saved!");
      setShowSettings(false);
    } catch { toast.error("Failed to save"); }
  };

  // ── BMI ──
  const latestWeight = logs.length > 0 ? logs[logs.length - 1] : null;
  const bmi = useMemo(() => {
    if (!profile?.height_cm || !latestWeight) return null;
    const h = Number(profile.height_cm) / 100;
    let w = Number(latestWeight.weight);
    if (latestWeight.unit === "lbs") w *= 0.453592;
    return w / (h * h);
  }, [profile?.height_cm, latestWeight]);

  const bmiCategory = useMemo(() => {
    if (!bmi) return null;
    if (bmi < 18.5) return { label: "Underweight", color: "text-amber-500" };
    if (bmi < 25) return { label: "Healthy", color: "text-emerald-500" };
    if (bmi < 30) return { label: "Overweight", color: "text-amber-500" };
    return { label: "Obese", color: "text-red-500" };
  }, [bmi]);

  // ── Goal Progress ──
  const goalProgress = useMemo(() => {
    if (!profile?.goal_weight || logs.length < 2) return null;
    const goal = Number(profile.goal_weight);
    const first = Number(logs[0].weight);
    const current = Number(logs[logs.length - 1].weight);
    const totalDelta = Math.abs(goal - first);
    if (totalDelta === 0) return null;
    const progressDelta = Math.abs(current - first);
    const direction = goal < first ? "lose" : "gain";
    const isMovingRight = direction === "lose" ? current <= first : current >= first;
    const pct = isMovingRight ? Math.min(100, (progressDelta / totalDelta) * 100) : 0;
    const remaining = Math.abs(current - goal);
    return { pct, remaining, direction, goal, current, unit: logs[logs.length - 1].unit };
  }, [profile?.goal_weight, logs]);

  // ── Weekly Summary ──
  const weeklySummary = useMemo(() => {
    if (logs.length < 2) return null;
    const now = new Date();
    const weekAgo = subDays(now, 7);
    const monthAgo = subDays(now, 30);
    const thisWeek = logs.filter(l => isAfter(parseISO(l.date), weekAgo));
    const lastMonth = logs.filter(l => isAfter(parseISO(l.date), monthAgo));
    if (thisWeek.length < 1) return null;
    const currentW = Number(logs[logs.length - 1].weight);
    const weekStart = thisWeek.length > 1 ? Number(thisWeek[0].weight) : null;
    const monthStart = lastMonth.length > 1 ? Number(lastMonth[0].weight) : null;
    const weekChange = weekStart !== null ? currentW - weekStart : null;
    const monthChange = monthStart !== null ? currentW - monthStart : null;
    const avg = lastMonth.reduce((s, l) => s + Number(l.weight), 0) / lastMonth.length;
    return { weekChange, monthChange, avg, unit: logs[logs.length - 1].unit };
  }, [logs]);

  // ── Symptom Correlation ──
  const correlationData = useMemo(() => {
    if (logs.length < 3 || entries.length < 3) return null;
    const weightMap = new Map(logs.map(l => [l.date, Number(l.weight)]));
    const merged = entries
      .filter(e => weightMap.has(e.date))
      .map(e => ({
        date: format(parseISO(e.date), "MMM d"),
        weight: weightMap.get(e.date)!,
        fatigue: e.fatigue,
        mood: e.mood,
      }));
    return merged.length >= 3 ? merged : null;
  }, [logs, entries]);

  const chartData = useMemo(() => logs.map((l) => ({
    date: format(new Date(l.date + "T12:00:00"), "MMM d"),
    weight: Number(l.weight),
  })), [logs]);

  return (
    <>
      {/* Log Weight */}
      <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold text-foreground">Log Weight</h3>
          <button onClick={() => { setShowSettings(!showSettings); setHeightInput(profile?.height_cm?.toString() ?? ""); setGoalInput(profile?.goal_weight?.toString() ?? ""); }} className="text-xs text-primary hover:underline">
            {showSettings ? "Cancel" : "⚙ Settings"}
          </button>
        </div>
        <div className="flex gap-2">
          <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Weight" step="0.1" className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          <select value={unit} onChange={(e) => setUnit(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
            <option value="kg">kg</option>
            <option value="lbs">lbs</option>
          </select>
          <button onClick={handleAdd} disabled={addWeight.isPending} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">Log</button>
        </div>
        {showSettings && (
          <div className="space-y-2 pt-2 border-t border-border">
            <div>
              <label className="text-xs text-muted-foreground">Height (cm)</label>
              <input type="number" value={heightInput} onChange={e => setHeightInput(e.target.value)} placeholder="e.g. 170" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Goal Weight ({unit})</label>
              <input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)} placeholder="e.g. 70" step="0.1" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <button onClick={handleSaveSettings} disabled={updateProfile.isPending} className="w-full rounded-lg bg-primary py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60">
              {updateProfile.isPending ? "Saving…" : "Save Settings"}
            </button>
          </div>
        )}
      </div>

      {/* BMI Card */}
      {bmi && bmiCategory && (
        <div className="rounded-xl bg-card p-4 shadow-soft">
          <h3 className="font-display text-sm font-semibold text-foreground mb-2">BMI</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{bmi.toFixed(1)}</span>
            <span className={`text-sm font-medium ${bmiCategory.color}`}>{bmiCategory.label}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            For MS patients, maintaining a healthy BMI (18.5–24.9) may help reduce fatigue and support mobility. Higher BMI is linked to increased inflammation and faster disability progression.
          </p>
        </div>
      )}

      {/* Goal Progress */}
      {goalProgress && (
        <div className="rounded-xl bg-card p-4 shadow-soft space-y-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="font-display text-sm font-semibold text-foreground">Goal Progress</h3>
          </div>
          <Progress value={goalProgress.pct} className="h-2.5" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{goalProgress.pct.toFixed(0)}% complete</span>
            <span>{goalProgress.remaining.toFixed(1)} {goalProgress.unit} to {goalProgress.direction === "lose" ? "lose" : "gain"}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">Goal: {goalProgress.goal} {goalProgress.unit}</p>
        </div>
      )}

      {/* Weekly / Monthly Summary */}
      {weeklySummary && (
        <div className="rounded-xl bg-card p-4 shadow-soft">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">Change Summary</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">7-day</p>
              {weeklySummary.weekChange !== null ? (
                <p className={`text-sm font-bold flex items-center justify-center gap-0.5 ${weeklySummary.weekChange > 0 ? "text-amber-500" : weeklySummary.weekChange < 0 ? "text-emerald-500" : "text-foreground"}`}>
                  {weeklySummary.weekChange > 0 ? <TrendingUp className="h-3 w-3" /> : weeklySummary.weekChange < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                  {weeklySummary.weekChange > 0 ? "+" : ""}{weeklySummary.weekChange.toFixed(1)}
                </p>
              ) : <p className="text-xs text-muted-foreground">—</p>}
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">30-day</p>
              {weeklySummary.monthChange !== null ? (
                <p className={`text-sm font-bold flex items-center justify-center gap-0.5 ${weeklySummary.monthChange > 0 ? "text-amber-500" : weeklySummary.monthChange < 0 ? "text-emerald-500" : "text-foreground"}`}>
                  {weeklySummary.monthChange > 0 ? <TrendingUp className="h-3 w-3" /> : weeklySummary.monthChange < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                  {weeklySummary.monthChange > 0 ? "+" : ""}{weeklySummary.monthChange.toFixed(1)}
                </p>
              ) : <p className="text-xs text-muted-foreground">—</p>}
            </div>
            <div className="text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg</p>
              <p className="text-sm font-bold text-foreground">{weeklySummary.avg.toFixed(1)}</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">All values in {weeklySummary.unit}</p>
        </div>
      )}

      {/* Weight Trend Chart */}
      {chartData.length >= 2 && (
        <div className="rounded-xl bg-card p-4 shadow-soft">
          <h3 className="font-display text-sm font-semibold text-foreground mb-3">Weight Trend</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} width={40} />
              <Tooltip />
              {profile?.goal_weight && (
                <ReferenceLine y={Number(profile.goal_weight)} stroke="hsl(var(--primary))" strokeDasharray="4 4" label={{ value: "Goal", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              )}
              <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Symptom Correlation */}
      {correlationData && (
        <div className="rounded-xl bg-card p-4 shadow-soft">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="font-display text-sm font-semibold text-foreground">Weight vs Symptoms</h3>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={correlationData}>
              <XAxis dataKey="date" tick={{ fontSize: 9 }} />
              <YAxis yAxisId="weight" domain={["auto", "auto"]} tick={{ fontSize: 9 }} width={35} />
              <YAxis yAxisId="symptom" orientation="right" domain={[0, 10]} tick={{ fontSize: 9 }} width={25} />
              <Tooltip />
              <Line yAxisId="weight" type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Weight" />
              <Line yAxisId="symptom" type="monotone" dataKey="fatigue" stroke="hsl(var(--destructive))" strokeWidth={1.5} dot={false} name="Fatigue" strokeDasharray="4 2" />
              <Line yAxisId="symptom" type="monotone" dataKey="mood" stroke="hsl(var(--accent-foreground))" strokeWidth={1.5} dot={false} name="Mood" strokeDasharray="2 2" />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-muted-foreground mt-2">
            Track how weight changes correlate with fatigue and mood over time. Weight management can significantly impact MS symptom severity.
          </p>
        </div>
      )}

      {/* Recent Entries */}
      {/* AI Insights */}
      <AIWeightInsights
        weightLogs={logs}
        symptomEntries={entries}
        profile={profile ? { ms_type: profile.ms_type, height_cm: profile.height_cm, goal_weight: profile.goal_weight, goal_weight_unit: profile.goal_weight_unit } : null}
      />

      {/* Recent Entries */}
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

      {/* No height prompt */}
      {!profile?.height_cm && logs.length > 0 && (
        <div className="rounded-xl bg-primary/5 border border-primary/15 p-3 text-center">
          <p className="text-xs text-muted-foreground">💡 Add your height in ⚙ Settings above to see your BMI</p>
        </div>
      )}
    </>
  );
}
