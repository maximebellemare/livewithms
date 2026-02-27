import { useState, useCallback } from "react";
import { format } from "date-fns";
import SEOHead from "@/components/SEOHead";
import PageHeader from "@/components/PageHeader";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Dumbbell, Salad, Scale, Minus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PullToRefresh from "@/components/PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";
import {
  useExerciseLogs, useAddExercise, useDeleteExercise,
} from "@/hooks/useLifestyleTracking";
import DietPlanTab from "@/components/lifestyle/DietPlanTab";
import WeightTab from "@/components/lifestyle/WeightTab";

const EXERCISE_TYPES = ["Walking", "Swimming", "Yoga", "Stretching", "Cycling", "Strength Training", "Pilates", "Tai Chi", "Other"];
const INTENSITIES = ["light", "moderate", "vigorous"];


const today = format(new Date(), "yyyy-MM-dd");

const LifestylePage = () => {
  const [activeTab, setActiveTab] = useState("exercise");
  const queryClient = useQueryClient();

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["exercise-logs"] });
    await queryClient.invalidateQueries({ queryKey: ["diet-plans"] });
    await queryClient.invalidateQueries({ queryKey: ["user-diet-plan"] });
    await queryClient.invalidateQueries({ queryKey: ["weight-logs"] });
  }, [queryClient]);

  return (
    <>
      <SEOHead title="Lifestyle" description="Track exercise, diet plans, and weight." />
      <PageHeader title="Lifestyle" subtitle="Track your daily wellness habits 🏋️" showBack />
      <PullToRefresh onRefresh={handleRefresh} className="mx-auto max-w-lg px-4 py-4 animate-fade-in">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="exercise" className="text-xs"><Dumbbell className="h-3.5 w-3.5 mr-1" />Exercise</TabsTrigger>
            <TabsTrigger value="diet" className="text-xs"><Salad className="h-3.5 w-3.5 mr-1" />Diet</TabsTrigger>
            <TabsTrigger value="weight" className="text-xs"><Scale className="h-3.5 w-3.5 mr-1" />Weight</TabsTrigger>
          </TabsList>

          <TabsContent value="exercise" className="mt-4 space-y-4"><ExerciseTab /></TabsContent>
          <TabsContent value="diet" className="mt-4 space-y-4"><DietPlanTab /></TabsContent>
          <TabsContent value="weight" className="mt-4 space-y-4"><WeightTab /></TabsContent>
        </Tabs>
      </PullToRefresh>
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

export default LifestylePage;
