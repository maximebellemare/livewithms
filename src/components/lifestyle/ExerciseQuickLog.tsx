import { useState } from "react";
import { Loader2, Check, X } from "lucide-react";
import { useAddExercise } from "@/hooks/useLifestyleTracking";
import { format } from "date-fns";
import { toast } from "sonner";

const today = format(new Date(), "yyyy-MM-dd");

const EXERCISES = [
  { emoji: "🚶", label: "Walk", type: "Walking", intensity: "light" },
  { emoji: "🧘", label: "Yoga", type: "Yoga", intensity: "light" },
  { emoji: "🏊", label: "Swim", type: "Swimming", intensity: "moderate" },
  { emoji: "🤸", label: "Stretch", type: "Stretching", intensity: "light" },
  { emoji: "🚴", label: "Cycle", type: "Cycling", intensity: "moderate" },
  { emoji: "🏋️", label: "Strength", type: "Strength Training", intensity: "moderate" },
  { emoji: "🧎", label: "Pilates", type: "Pilates", intensity: "light" },
  { emoji: "🥋", label: "Tai Chi", type: "Tai Chi", intensity: "light" },
  { emoji: "🏃", label: "Jogging", type: "Jogging", intensity: "moderate" },
  { emoji: "💃", label: "Dance", type: "Dance", intensity: "moderate" },
  { emoji: "🧗", label: "Climbing", type: "Climbing", intensity: "vigorous" },
  { emoji: "🏸", label: "Badminton", type: "Badminton", intensity: "moderate" },
  { emoji: "⚽", label: "Football", type: "Football", intensity: "vigorous" },
  { emoji: "🎾", label: "Tennis", type: "Tennis", intensity: "moderate" },
  { emoji: "🏓", label: "Table Tennis", type: "Table Tennis", intensity: "light" },
  { emoji: "🧹", label: "Housework", type: "Housework", intensity: "light" },
  { emoji: "🌿", label: "Gardening", type: "Gardening", intensity: "light" },
  { emoji: "🛶", label: "Rowing", type: "Rowing", intensity: "moderate" },
  { emoji: "⛷️", label: "Skiing", type: "Skiing", intensity: "vigorous" },
  { emoji: "🏌️", label: "Golf", type: "Golf", intensity: "light" },
] as const;

type SelectedExercise = typeof EXERCISES[number];

export default function ExerciseQuickLog() {
  const addExercise = useAddExercise();
  const [selected, setSelected] = useState<SelectedExercise | null>(null);
  const [duration, setDuration] = useState(15);

  const handleConfirm = async () => {
    if (!selected) return;
    try {
      await addExercise.mutateAsync({
        date: today,
        type: selected.type,
        duration_minutes: duration,
        intensity: selected.intensity,
        notes: null,
      });
      toast.success(`${selected.type} logged — ${duration} min!`);
      setSelected(null);
      setDuration(15);
    } catch {
      toast.error("Failed to log exercise");
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="font-display text-sm font-semibold text-foreground">Quick Log</h3>

      {selected ? (
        <div className="rounded-xl bg-card p-4 shadow-soft space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {selected.emoji} {selected.type}
            </span>
            <button onClick={() => { setSelected(null); setDuration(15); }} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Duration (minutes)</label>
            <div className="flex items-center gap-3 mt-1">
              {[10, 15, 20, 30, 45, 60].map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                    duration === d
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground hover:bg-muted"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <input
              type="range"
              min={5}
              max={120}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full mt-2 accent-primary"
            />
            <p className="text-center text-sm font-semibold text-foreground">{duration} min</p>
          </div>
          <button
            onClick={handleConfirm}
            disabled={addExercise.isPending}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-all"
          >
            {addExercise.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {addExercise.isPending ? "Saving…" : "Log Exercise"}
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {EXERCISES.map((ex) => (
            <button
              key={ex.type}
              onClick={() => setSelected(ex)}
              className="rounded-full bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-soft hover:bg-accent/30 active:scale-95 transition-all"
            >
              {ex.emoji} {ex.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
