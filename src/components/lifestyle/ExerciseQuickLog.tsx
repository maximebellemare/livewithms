import { Dumbbell, Loader2 } from "lucide-react";
import { useAddExercise } from "@/hooks/useLifestyleTracking";
import { format } from "date-fns";
import { toast } from "sonner";

const today = format(new Date(), "yyyy-MM-dd");

const PRESETS = [
  { label: "🚶 15 min Walk", type: "Walking", duration: 15, intensity: "light" },
  { label: "🧘 20 min Yoga", type: "Yoga", duration: 20, intensity: "light" },
  { label: "🏊 30 min Swim", type: "Swimming", duration: 30, intensity: "moderate" },
  { label: "🤸 15 min Stretch", type: "Stretching", duration: 15, intensity: "light" },
  { label: "🚴 20 min Cycle", type: "Cycling", duration: 20, intensity: "moderate" },
  { label: "🏋️ 20 min Strength", type: "Strength Training", duration: 20, intensity: "moderate" },
] as const;

export default function ExerciseQuickLog() {
  const addExercise = useAddExercise();

  const handleQuickLog = async (preset: typeof PRESETS[number]) => {
    try {
      await addExercise.mutateAsync({
        date: today,
        type: preset.type,
        duration_minutes: preset.duration,
        intensity: preset.intensity,
        notes: null,
      });
      toast.success(`${preset.type} logged!`);
    } catch {
      toast.error("Failed to log exercise");
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="font-display text-sm font-semibold text-foreground">Quick Log</h3>
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => handleQuickLog(p)}
            disabled={addExercise.isPending}
            className="rounded-xl bg-card px-2 py-2.5 text-center shadow-soft hover:bg-accent/30 active:scale-95 transition-all disabled:opacity-60"
          >
            <span className="text-xs font-medium text-foreground leading-tight block">{p.label}</span>
            <span className="text-[10px] text-muted-foreground">{p.duration} min</span>
          </button>
        ))}
      </div>
    </div>
  );
}
