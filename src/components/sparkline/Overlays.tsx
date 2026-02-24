import { CheckCircle2 } from "lucide-react";

export function LongPressOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden animate-fade-in flex items-center justify-center">
      <div className="absolute inset-0 bg-primary/8" />
      <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="22" cy="22" r="18" fill="none" stroke="hsl(var(--primary) / 0.15)" strokeWidth="3" />
        <circle
          cx="22" cy="22" r="18" fill="none"
          stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round"
          strokeDasharray="113.1"
          style={{ animation: "ring-fill 0.5s linear forwards" }}
        />
      </svg>
      <span className="absolute bottom-1.5 text-[8px] font-semibold tracking-wide text-primary/80 bg-primary/15 px-2 py-0.5 rounded-full">
        insights →
      </span>
    </div>
  );
}

export function SavedOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[hsl(145_45%_45%/0.12)] animate-fade-in pointer-events-none rounded-xl">
      <CheckCircle2 className="h-7 w-7 text-[hsl(145_45%_38%)] drop-shadow" />
    </div>
  );
}
