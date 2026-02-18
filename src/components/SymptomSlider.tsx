import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SymptomSliderProps {
  label: string;
  emoji: string;
  value: number;
  onChange: (v: number) => void;
  color?: string;
  weekAvg?: number | null;
}

const TrendArrow = ({ current, avg }: { current: number; avg: number }) => {
  const diff = current - avg;
  if (Math.abs(diff) < 0.5) {
    return (
      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
        <Minus className="h-3 w-3" />
        <span>avg</span>
      </span>
    );
  }
  if (diff > 0) {
    return (
      <span className="flex items-center gap-0.5 text-[10px] text-destructive">
        <TrendingUp className="h-3 w-3" />
        <span>+{diff.toFixed(1)}</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-[10px] text-emerald-500">
      <TrendingDown className="h-3 w-3" />
      <span>{diff.toFixed(1)}</span>
    </span>
  );
};

const SymptomSlider = ({ label, emoji, value, onChange, color = "bg-primary", weekAvg }: SymptomSliderProps) => {
  const percentage = (value / 10) * 100;

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {weekAvg != null && <TrendArrow current={value} avg={weekAvg} />}
          <span className="min-w-[2rem] text-right text-lg font-bold text-primary">{value}</span>
        </div>
      </div>
      <div className="relative">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${color} transition-all duration-200`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>None</span>
        <span>Severe</span>
      </div>
    </div>
  );
};

export default SymptomSlider;
