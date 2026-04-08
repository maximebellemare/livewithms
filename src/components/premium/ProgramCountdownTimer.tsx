import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw } from "lucide-react";

interface ProgramCountdownTimerProps {
  seconds: number;
  label?: string;
  onComplete?: () => void;
}

const CIRCLE_R = 46;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R;

/** Simple countdown circle for timed non-breathing exercises (e.g. "hold for 60 seconds"). */
const ProgramCountdownTimer = ({ seconds, label, onComplete }: ProgramCountdownTimerProps) => {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);

  const remaining = Math.max(seconds - elapsed, 0);
  const progress = Math.min(elapsed / seconds, 1);
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  useEffect(() => {
    if (!running || done) return;
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 0.05;
        if (next >= seconds) {
          setRunning(false);
          setDone(true);
          onComplete?.();
          return seconds;
        }
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [running, done, seconds, onComplete]);

  const reset = () => {
    setRunning(false);
    setElapsed(0);
    setDone(false);
  };

  const toggle = () => {
    if (done) { reset(); return; }
    setRunning((r) => !r);
  };

  return (
    <div className="flex flex-col items-center gap-2 py-3">
      <div className="relative flex items-center justify-center" style={{ width: 112, height: 112 }}>
        <svg width={112} height={112} className="absolute -rotate-90">
          <circle cx={56} cy={56} r={CIRCLE_R} fill="none" stroke="hsl(var(--muted))" strokeWidth={5} />
          <motion.circle
            cx={56} cy={56} r={CIRCLE_R}
            fill="none" stroke="hsl(var(--primary))" strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.05s linear" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-lg font-semibold text-foreground tabular-nums">
            {done ? "✓" : `${Math.ceil(remaining)}s`}
          </span>
          {label && !done && (
            <span className="text-[10px] text-muted-foreground mt-0.5 max-w-[72px] text-center leading-tight">
              {label}
            </span>
          )}
          {done && <span className="text-[10px] text-primary font-medium">Complete</span>}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={toggle}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-95 transition-transform"
          aria-label={running ? "Pause" : "Start"}
        >
          {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
        </button>
        {(running || elapsed > 0 || done) && (
          <button onClick={reset}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground active:scale-95 transition-all"
            aria-label="Reset"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ProgramCountdownTimer;
