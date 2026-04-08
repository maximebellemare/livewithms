import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";

export interface TimerPhase {
  label: string;
  duration: number; // seconds
}

interface ProgramTimerProps {
  phases: TimerPhase[];
  cycles: number;
  onComplete?: () => void;
}

const CIRCLE_R = 46;
const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R;

const ProgramTimer = ({ phases, cycles, onComplete }: ProgramTimerProps) => {
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycle, setCycle] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playChime = useCallback(
    (freq = 600, dur = 0.15) => {
      if (!soundOn) return;
      try {
        if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + dur);
      } catch {
        /* silent */
      }
    },
    [soundOn]
  );

  const currentPhase = phases[phaseIdx];
  const phaseDuration = currentPhase.duration;
  const progress = Math.min(elapsed / phaseDuration, 1);
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const label = currentPhase.label.toLowerCase();
  const isInhale = label.includes("inhale") || label.includes("breathe in");
  const isExhale = label.includes("exhale") || label.includes("breathe out");
  const breathScale = running
    ? isInhale
      ? 0.55 + 0.45 * progress
      : isExhale
        ? 1 - 0.45 * progress
        : label.includes("hold")
          ? 1
          : 0.7
    : 0.65;

  const advance = useCallback(() => {
    const nextPhase = phaseIdx + 1;
    if (nextPhase >= phases.length) {
      const nextCycle = cycle + 1;
      if (nextCycle >= cycles) {
        playChime(800, 0.3);
        setRunning(false);
        setDone(true);
        onComplete?.();
        return;
      }
      setCycle(nextCycle);
      setPhaseIdx(0);
      playChime(600, 0.15);
    } else {
      setPhaseIdx(nextPhase);
      playChime(550, 0.12);
    }
    setElapsed(0);
  }, [phaseIdx, cycle, phases, cycles, playChime, onComplete]);

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
    <div className="flex flex-col items-center gap-2 py-3">
      <div className="relative flex items-center justify-center" style={{ width: 112, height: 112 }}>
        <svg width={112} height={112} className="absolute -rotate-90">
          <circle cx={56} cy={56} r={CIRCLE_R} fill="none" stroke="hsl(var(--muted))" strokeWidth={5} />
          <motion.circle
            cx={56}
            cy={56}
            r={CIRCLE_R}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.05s linear" }}
          />
        </svg>
        <motion.div
          animate={{ scale: breathScale }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="absolute rounded-full bg-primary/10"
          style={{ width: 64, height: 64 }}
        />
        <div className="absolute flex flex-col items-center">
          <AnimatePresence mode="wait">
            <motion.span
              key={`${phaseIdx}-${cycle}`}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.12 }}
              className="text-xs font-semibold text-foreground"
            >
              {done ? "Done ✓" : currentPhase.label}
            </motion.span>
          </AnimatePresence>
          {!done && running && (
            <span className="text-[10px] text-muted-foreground mt-0.5">
              {Math.ceil(phaseDuration - elapsed)}s
            </span>
          )}
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground">
        {done ? `${cycles} cycles complete` : `Cycle ${cycle + 1} of ${cycles}`}
      </p>

      <div className="flex items-center gap-1.5">
        <button
          onClick={toggle}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-95 transition-transform"
          aria-label={running ? "Pause" : "Start"}
        >
          {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
        </button>
        {(running || elapsed > 0 || done) && (
          <button
            onClick={reset}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground active:scale-95 transition-all"
            aria-label="Reset"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => setSoundOn((s) => !s)}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-all active:scale-95 ${
            soundOn ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
          aria-label={soundOn ? "Mute" : "Enable sound"}
        >
          {soundOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
};

export default ProgramTimer;
