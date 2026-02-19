import { useState, useEffect } from "react";
import { Droplets, Minus, Plus, Target } from "lucide-react";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useTodayEntry, useSaveEntry } from "@/hooks/useEntries";
import { toast } from "sonner";

const HydrationCard = () => {
  const { data: profile } = useProfile();
  const { data: todayEntry } = useTodayEntry();
  const saveEntry = useSaveEntry();
  const updateProfile = useUpdateProfile();

  const goal = profile?.hydration_goal ?? 8;
  const [glasses, setGlasses] = useState(0);
  const [editingGoal, setEditingGoal] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (todayEntry && !initialized) {
      setGlasses(todayEntry.water_glasses ?? 0);
      setInitialized(true);
    }
  }, [todayEntry, initialized]);

  const progress = Math.min(glasses / goal, 1);
  const isComplete = glasses >= goal;

  const updateGlasses = async (newValue: number) => {
    const clamped = Math.max(0, Math.min(20, newValue));
    setGlasses(clamped);

    try {
      await saveEntry.mutateAsync({
        date: new Date().toISOString().split("T")[0],
        fatigue: todayEntry?.fatigue ?? null,
        pain: todayEntry?.pain ?? null,
        brain_fog: todayEntry?.brain_fog ?? null,
        mood: todayEntry?.mood ?? null,
        mobility: todayEntry?.mobility ?? null,
        sleep_hours: todayEntry?.sleep_hours ?? null,
        notes: todayEntry?.notes ?? null,
        mood_tags: todayEntry?.mood_tags ?? [],
        water_glasses: clamped,
      } as any);

      if (clamped >= goal && (clamped - 1) < goal) {
        toast.success("Hydration goal reached! 💧🎉");
      }
    } catch {
      setGlasses(glasses); // revert
    }
  };

  const handleSetGoal = async (newGoal: number) => {
    const clamped = Math.max(1, Math.min(20, newGoal));
    try {
      await updateProfile.mutateAsync({ hydration_goal: clamped });
      setEditingGoal(false);
      toast.success(`Hydration goal set to ${clamped} glasses`);
    } catch {
      toast.error("Failed to update goal");
    }
  };

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Hydration</span>
        </div>
        <button
          onClick={() => setEditingGoal(!editingGoal)}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
        >
          <Target className="h-3 w-3" />
          Goal: {goal}
        </button>
      </div>

      {editingGoal && (
        <div className="flex items-center gap-2 animate-fade-in">
          <span className="text-xs text-muted-foreground">Daily goal:</span>
          <div className="flex items-center gap-1">
            {[4, 6, 8, 10, 12].map((g) => (
              <button
                key={g}
                onClick={() => handleSetGoal(g)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors border ${
                  goal === g
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => updateGlasses(glasses - 1)}
          disabled={glasses <= 0 || saveEntry.isPending}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-all active:scale-95 disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="text-center">
          <span className={`text-2xl font-bold tabular-nums ${isComplete ? "text-primary" : "text-foreground"}`}>
            {glasses}
          </span>
          <span className="text-sm text-muted-foreground"> / {goal}</span>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {isComplete ? "Goal reached! 🎉" : `${goal - glasses} more to go`}
          </p>
        </div>

        <button
          onClick={() => updateGlasses(glasses + 1)}
          disabled={glasses >= 20 || saveEntry.isPending}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all active:scale-95 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Water drops visualization */}
      <div className="flex flex-wrap gap-1 justify-center">
        {Array.from({ length: goal }, (_, i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-full transition-all duration-300 ${
              i < glasses ? "bg-primary scale-100" : "bg-muted scale-90"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HydrationCard;
