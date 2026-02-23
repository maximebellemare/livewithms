import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";

type Phase = "inhale" | "hold" | "exhale" | "holdOut";

interface PhaseConfig {
  label: string;
  duration: number; // seconds
  color: string; // tailwind hsl token
}

interface BreathingPattern {
  name: string;
  phases: { phase: Phase; config: PhaseConfig }[];
  cycles: number;
}

const PATTERNS: Record<string, BreathingPattern> = {
  box: {
    name: "Box Breathing",
    phases: [
      { phase: "inhale", config: { label: "Inhale", duration: 4, color: "hsl(var(--primary))" } },
      { phase: "hold", config: { label: "Hold", duration: 4, color: "hsl(var(--accent))" } },
      { phase: "exhale", config: { label: "Exhale", duration: 4, color: "hsl(var(--primary))" } },
      { phase: "holdOut", config: { label: "Hold", duration: 4, color: "hsl(var(--accent))" } },
    ],
    cycles: 4,
  },
  "4-7-8": {
    name: "4-7-8 Breathing",
    phases: [
      { phase: "inhale", config: { label: "Inhale", duration: 4, color: "hsl(var(--primary))" } },
      { phase: "hold", config: { label: "Hold", duration: 7, color: "hsl(var(--accent))" } },
      { phase: "exhale", config: { label: "Exhale", duration: 8, color: "hsl(var(--primary))" } },
    ],
    cycles: 4,
  },
  deep: {
    name: "Deep Breathing",
    phases: [
      { phase: "inhale", config: { label: "Inhale", duration: 5, color: "hsl(var(--primary))" } },
      { phase: "exhale", config: { label: "Exhale", duration: 5, color: "hsl(var(--primary))" } },
    ],
    cycles: 5,
  },
};

const CIRCLE_R = 54;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R;

interface BreathingTimerProps {
  pattern: "box" | "4-7-8" | "deep";
}

const BreathingTimer = ({ pattern }: BreathingTimerProps) => {
  const config = PATTERNS[pattern] || PATTERNS.box;
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playChime = useCallback((freq: number = 600, dur: number = 0.15) => {
    if (!soundOn) return;
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch { /* silent fallback */ }
  }, [soundOn]);

  const currentPhase = config.phases[phaseIdx];
  const phaseDuration = currentPhase.config.duration;
  const progress = Math.min(elapsed / phaseDuration, 1);
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  // Scale animation for the inner circle (breathe in = grow, out = shrink)
  const isInhale = currentPhase.phase === "inhale";
  const isExhale = currentPhase.phase === "exhale";
  const breathScale = running
    ? isInhale
      ? 0.6 + 0.4 * progress
      : isExhale
        ? 1 - 0.4 * progress
        : currentPhase.phase === "hold"
          ? 1
          : 0.6
    : 0.7;

  const haptic = useCallback((style: "light" | "medium" | "heavy" = "light") => {
    if (!navigator.vibrate) return;
    const ms = style === "heavy" ? 30 : style === "medium" ? 15 : 10;
    navigator.vibrate(ms);
  }, []);

  const advance = useCallback(() => {
    haptic("medium");
    const nextPhase = phaseIdx + 1;
    if (nextPhase >= config.phases.length) {
      const nextCycle = cycle + 1;
      if (nextCycle >= config.cycles) {
        haptic("heavy");
        playChime(800, 0.3);
        setRunning(false);
        setDone(true);
        return;
      }
      setCycle(nextCycle);
      setPhaseIdx(0);
      playChime(600, 0.15);
    } else {
      setPhaseIdx(nextPhase);
      // Higher pitch for inhale, lower for exhale
      const next = config.phases[nextPhase];
      playChime(next.phase === "inhale" ? 660 : next.phase === "exhale" ? 440 : 520, 0.12);
    }
    setElapsed(0);
  }, [phaseIdx, cycle, config, haptic, playChime]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 0.05;
        if (next >= phaseDuration) {
          advance();
          return 0;
        }
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [running, phaseDuration, advance]);

  const reset = () => {
    setRunning(false);
    setPhaseIdx(0);
    setCycle(0);
    setElapsed(0);
    setDone(false);
  };

  const toggle = () => {
    if (done) {
      reset();
      return;
    }
    setRunning((r) => !r);
  };

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {/* Circle */}
      <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
        <svg width={140} height={140} className="absolute -rotate-90">
          {/* Track */}
          <circle
            cx={70}
            cy={70}
            r={CIRCLE_R}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={6}
          />
          {/* Progress arc */}
          <motion.circle
            cx={70}
            cy={70}
            r={CIRCLE_R}
            fill="none"
            stroke={currentPhase.config.color}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.05s linear" }}
          />
        </svg>
        {/* Inner breathing circle */}
        <motion.div
          animate={{ scale: breathScale }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="absolute rounded-full bg-primary/10"
          style={{ width: 80, height: 80 }}
        />
        {/* Label */}
        <div className="absolute flex flex-col items-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={`${phaseIdx}-${cycle}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="text-sm font-semibold text-foreground"
            >
              {done ? "Done ✓" : currentPhase.config.label}
            </motion.span>
          </AnimatePresence>
          {!done && running && (
            <span className="text-[11px] text-muted-foreground mt-0.5">
              {Math.ceil(phaseDuration - elapsed)}s
            </span>
          )}
        </div>
      </div>

      {/* Cycle counter */}
      <p className="text-[11px] text-muted-foreground">
        {done ? `${config.cycles} cycles complete` : `Cycle ${cycle + 1} of ${config.cycles}`}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggle}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-95 transition-transform"
          aria-label={running ? "Pause" : "Start"}
        >
          {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </button>
        {(running || elapsed > 0 || done) && (
          <button
            onClick={reset}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground active:scale-95 transition-all"
            aria-label="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => setSoundOn((s) => !s)}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-95 ${
            soundOn
              ? "bg-primary/15 text-primary"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
          aria-label={soundOn ? "Mute chime" : "Enable chime"}
        >
          {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};

/**
 * Detects if a message contains a breathing exercise and returns the pattern type.
 */
export function detectBreathingPattern(content: string): "box" | "4-7-8" | "deep" | null {
  const lower = content.toLowerCase();
  if (lower.includes("4-7-8") || lower.includes("4–7–8")) return "4-7-8";
  if (lower.includes("box breathing") || lower.includes("square breathing")) return "box";
  if (
    lower.includes("deep breathing") ||
    lower.includes("diaphragmatic") ||
    lower.includes("belly breathing")
  )
    return "deep";
  // Generic breathing detection with inhale/exhale keywords
  if (
    (lower.includes("inhale") && lower.includes("exhale")) ||
    lower.includes("breathing exercise") ||
    lower.includes("breath work")
  )
    return "box";
  return null;
}

export default BreathingTimer;
