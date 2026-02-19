import { toast } from "sonner";
import { UseMutateAsyncFunction } from "@tanstack/react-query";

type EntryPayload = {
  date: string;
  fatigue: number;
  pain: number;
  brain_fog: number;
  mood: number;
  mobility: number;
  mood_tags: string[];
  notes: string | null;
  sleep_hours: number | null;
};

interface InlineQuickLogProps {
  /** The metric this panel controls */
  metric: "mood" | "fatigue" | "pain" | "brain_fog";
  label: string;
  emoji: string;
  /** Whether higher values are better (affects colour direction) */
  higherIsBetter?: boolean;
  /** Current value for this metric */
  value: number;
  onChange: (v: number) => void;
  onClose: () => void;
  /** Called after a successful save so the parent can flash the card */
  onSaved?: () => void;
  /** Full entry payload to persist — all fields must be up-to-date before saving */
  entryPayload: EntryPayload;
  saveAsync: UseMutateAsyncFunction<unknown, Error, EntryPayload>;
  isSaving: boolean;
}

function getColor(val: number, higherIsBetter: boolean): string {
  if (higherIsBetter) {
    return val >= 7 ? "hsl(145 45% 45%)" : val >= 4 ? "hsl(45 90% 52%)" : "hsl(0 72% 51%)";
  }
  return val <= 3 ? "hsl(145 45% 45%)" : val <= 6 ? "hsl(45 90% 52%)" : "hsl(0 72% 51%)";
}

export default function InlineQuickLog({
  label,
  emoji,
  higherIsBetter = false,
  value,
  onChange,
  onClose,
  onSaved,
  entryPayload,
  saveAsync,
  isSaving,
}: InlineQuickLogProps) {
  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await saveAsync(entryPayload);
      onSaved?.();        // fires blockGrid() synchronously before panel unmounts
      onClose();          // unmounts the panel
      toast.success(`${label} logged: ${value}/10 ${emoji}`);
    } catch (err: any) {
      toast.error("Failed to save: " + err.message);
    }
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="rounded-xl bg-card shadow-soft px-4 py-3 animate-fade-in border border-primary/20"
    >
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-semibold text-foreground">
          {emoji} {label} today (0–10)
        </label>
        <button
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded-md hover:bg-secondary"
        >
          Done
        </button>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => {
          const isSelected = value === val;
          const color = getColor(val, higherIsBetter);
          return (
            <button
              key={val}
              onClick={() => onChange(val)}
              className="flex-1 min-w-[2rem] rounded-lg py-2 text-sm font-bold transition-all active:scale-95"
              style={{
                background: isSelected ? color : "hsl(var(--secondary))",
                color: isSelected ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                border: isSelected ? `1.5px solid ${color}` : "1.5px solid transparent",
              }}
            >
              {val}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="mt-3 w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50 transition-all hover:opacity-90 active:scale-[0.98]"
      >
        {isSaving ? "Saving…" : `Save ${label.toLowerCase()}`}
      </button>
      <p className="mt-1.5 text-[10px] text-muted-foreground text-center">
        Tap a number then <strong>Save {label.toLowerCase()}</strong>, or adjust below with the full form.
      </p>
    </div>
  );
}
