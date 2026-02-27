import { useState } from "react";
import { Loader2, Check, X, Plus } from "lucide-react";
import { useAddExercise } from "@/hooks/useLifestyleTracking";
import { format } from "date-fns";
import { toast } from "sonner";

const today = format(new Date(), "yyyy-MM-dd");

type Exercise = { emoji: string; label: string; type: string; intensity: string };

const DEFAULT_EXERCISES: Exercise[] = [
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
  { emoji: "🧽", label: "Cleaning", type: "Cleaning", intensity: "light" },
  { emoji: "🍽️", label: "Dishes", type: "Doing Dishes", intensity: "light" },
  { emoji: "👕", label: "Laundry", type: "Laundry", intensity: "light" },
  { emoji: "🛒", label: "Grocery Shopping", type: "Grocery Shopping", intensity: "light" },
  { emoji: "🐕", label: "Dog Walking", type: "Dog Walking", intensity: "light" },
  { emoji: "🧹", label: "Vacuuming", type: "Vacuuming", intensity: "light" },
  { emoji: "🪜", label: "DIY / Repairs", type: "DIY", intensity: "moderate" },
  { emoji: "📦", label: "Moving Boxes", type: "Moving Boxes", intensity: "moderate" },
  { emoji: "🚗", label: "Car Wash", type: "Car Wash", intensity: "light" },
  { emoji: "🧑‍🍳", label: "Cooking", type: "Cooking", intensity: "light" },
  { emoji: "🪴", label: "Plant Care", type: "Plant Care", intensity: "light" },
  { emoji: "🎳", label: "Bowling", type: "Bowling", intensity: "light" },
  { emoji: "🏐", label: "Volleyball", type: "Volleyball", intensity: "moderate" },
  { emoji: "🏀", label: "Basketball", type: "Basketball", intensity: "vigorous" },
  { emoji: "🎿", label: "Snowboarding", type: "Snowboarding", intensity: "vigorous" },
  { emoji: "🧘‍♂️", label: "Meditation", type: "Meditation", intensity: "light" },
];

const EMOJI_MAP: Record<string, string> = {
  walk: "🚶", run: "🏃", swim: "🏊", bike: "🚴", cycle: "🚴", yoga: "🧘",
  stretch: "🤸", dance: "💃", climb: "🧗", clean: "🧽", cook: "🧑‍🍳",
  garden: "🌿", dog: "🐕", shop: "🛒", laundry: "👕", dish: "🍽️",
  meditat: "🧘‍♂️", box: "🥊", tennis: "🎾", golf: "🏌️", ski: "⛷️",
  basket: "🏀", volley: "🏐", football: "⚽", soccer: "⚽", bowl: "🎳",
  row: "🛶", pilates: "🧎", tai: "🥋", strength: "🏋️", weight: "🏋️",
  jog: "🏃", hike: "🥾", snow: "🎿",
};

function guessEmoji(name: string): string {
  const lower = name.toLowerCase();
  for (const [keyword, emoji] of Object.entries(EMOJI_MAP)) {
    if (lower.includes(keyword)) return emoji;
  }
  return "🏅";
}

const CUSTOM_STORAGE_KEY = "exercise-quick-log-custom";

function loadCustomExercises(): Exercise[] {
  try {
    return JSON.parse(localStorage.getItem(CUSTOM_STORAGE_KEY) || "[]");
  } catch { return []; }
}

function saveCustomExercises(exercises: Exercise[]) {
  localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(exercises));
}

export default function ExerciseQuickLog() {
  const addExercise = useAddExercise();
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [duration, setDuration] = useState(15);
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customExercises, setCustomExercises] = useState<Exercise[]>(loadCustomExercises);

  const allExercises = [...DEFAULT_EXERCISES, ...customExercises];

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
      toast.success(`${selected.emoji} ${selected.type} logged — ${duration} min!`);
      setSelected(null);
      setDuration(15);
    } catch {
      toast.error("Failed to log exercise");
    }
  };

  const handleAddCustom = () => {
    const name = customName.trim();
    if (!name) return;
    if (allExercises.some((e) => e.type.toLowerCase() === name.toLowerCase())) {
      toast.error("Exercise already exists");
      return;
    }
    const emoji = guessEmoji(name);
    const newEx: Exercise = { emoji, label: name, type: name, intensity: "moderate" };
    const updated = [...customExercises, newEx];
    setCustomExercises(updated);
    saveCustomExercises(updated);
    setCustomName("");
    setShowCustom(false);
    setSelected(newEx);
    toast.success(`${emoji} ${name} added!`);
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
            <div className="flex items-center gap-3 mt-1 flex-wrap">
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
              max={240}
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
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {allExercises.map((ex) => (
              <button
                key={ex.type}
                onClick={() => setSelected(ex)}
                className="rounded-full bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-soft hover:bg-accent/30 active:scale-95 transition-all"
              >
                {ex.emoji} {ex.label}
              </button>
            ))}
            <button
              onClick={() => setShowCustom(!showCustom)}
              className="rounded-full bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-soft hover:bg-accent/30 active:scale-95 transition-all flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Custom
            </button>
          </div>

          {showCustom && (
            <div className="flex gap-2 animate-fade-in">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
                placeholder="e.g. Roller skating"
                maxLength={40}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                onClick={handleAddCustom}
                disabled={!customName.trim()}
                className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-all"
              >
                Add
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
