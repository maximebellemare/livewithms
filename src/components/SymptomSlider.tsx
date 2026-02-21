import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface SymptomSliderProps {
  label: string;
  emoji: string;
  value: number;
  onChange: (v: number) => void;
  weekAvg?: number | null;
  /** When true, higher values are better (e.g. mood). Inverts trend arrow colors. */
  higherIsBetter?: boolean;
}

const TrendArrow = ({ current, avg, higherIsBetter = false }: { current: number; avg: number; higherIsBetter?: boolean }) => {
  const diff = current - avg;
  if (Math.abs(diff) < 0.5) {
    return (
      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
        <Minus className="h-3 w-3" />
        <span>avg</span>
      </span>
    );
  }
  // "good" direction: down for pain/fatigue etc, up for mood
  const isGood = higherIsBetter ? diff > 0 : diff < 0;
  if (diff > 0) {
    return (
      <span className={`flex items-center gap-0.5 text-[10px] ${isGood ? "text-emerald-500" : "text-destructive"}`}>
        <TrendingUp className="h-3 w-3" />
        <span>+{diff.toFixed(1)}</span>
      </span>
    );
  }
  return (
    <span className={`flex items-center gap-0.5 text-[10px] ${isGood ? "text-emerald-500" : "text-destructive"}`}>
      <TrendingDown className="h-3 w-3" />
      <span>{diff.toFixed(1)}</span>
    </span>
  );
};

function sliderColor(value: number, higherIsBetter: boolean): string {
  if (higherIsBetter) {
    if (value >= 7) return "hsl(145 45% 45%)";
    if (value >= 4) return "hsl(45 90% 52%)";
    return "hsl(0 72% 51%)";
  }
  if (value <= 3) return "hsl(145 45% 45%)";
  if (value <= 6) return "hsl(45 90% 52%)";
  return "hsl(0 72% 51%)";
}

const SymptomSlider = ({ label, emoji, value, onChange, weekAvg, higherIsBetter = false }: SymptomSliderProps) => {
  const percentage = (value / 10) * 100;
  const dynamicColor = sliderColor(value, higherIsBetter);

  return (
    <div className="card-base">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {weekAvg != null && <TrendArrow current={value} avg={weekAvg} higherIsBetter={higherIsBetter} />}
          <span
            className="min-w-[2rem] text-right text-lg font-bold transition-colors duration-200"
            style={{ color: dynamicColor }}
          >
            {value}
          </span>
        </div>
      </div>
      <div className="relative">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{ width: `${percentage}%`, backgroundColor: dynamicColor }}
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
          aria-label={`${label} level, ${value} out of 10`}
          aria-valuemin={0}
          aria-valuemax={10}
          aria-valuenow={value}
          aria-valuetext={`${value} out of 10`}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{higherIsBetter ? "Low" : "None"}</span>
        <span>{higherIsBetter ? "High" : "Severe"}</span>
      </div>
    </div>
  );
};

export default SymptomSlider;

