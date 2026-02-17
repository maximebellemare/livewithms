import { useState } from "react";

interface SymptomSliderProps {
  label: string;
  emoji: string;
  value: number;
  onChange: (v: number) => void;
  color?: string;
}

const SymptomSlider = ({ label, emoji, value, onChange, color = "bg-primary" }: SymptomSliderProps) => {
  const percentage = (value / 10) * 100;

  return (
    <div className="rounded-xl bg-card p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <span className="min-w-[2rem] text-right text-lg font-bold text-primary">{value}</span>
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
