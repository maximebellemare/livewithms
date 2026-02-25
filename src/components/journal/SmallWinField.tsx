import { useState } from "react";
import { Trophy, Check } from "lucide-react";

interface Props {
  onSubmit: (win: string) => void;
}

const SmallWinField = ({ onSubmit }: Props) => {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSubmit(value.trim());
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="rounded-xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <Trophy className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
        <span className="text-xs font-semibold text-foreground">One small win today</span>
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        What's one thing you managed, no matter how small?
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setSubmitted(false); }}
          placeholder="e.g. I took a short walk…"
          maxLength={200}
          className="flex-1 rounded-lg bg-background border border-border px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || submitted}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
            submitted
              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
              : "bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40"
          }`}
        >
          {submitted ? <Check className="h-3 w-3" /> : "Add"}
        </button>
      </div>
    </div>
  );
};

export default SmallWinField;
