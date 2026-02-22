import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw } from "lucide-react";

type BreathingPattern = {
  id: string;
  name: string;
  description: string;
  phases: { label: string; duration: number; instruction: string }[];
};

const patterns: BreathingPattern[] = [
  {
    id: "box",
    name: "Box Breathing",
    description: "Calm your nervous system with equal phases. Used by Navy SEALs for focus.",
    phases: [
      { label: "Inhale", duration: 4, instruction: "Breathe in slowly" },
      { label: "Hold", duration: 4, instruction: "Keep lungs full" },
      { label: "Exhale", duration: 4, instruction: "Release gently" },
      { label: "Hold", duration: 4, instruction: "Rest empty" },
    ],
  },
  {
    id: "478",
    name: "4-7-8 Relaxing",
    description: "Dr. Weil's technique to activate your parasympathetic system and reduce anxiety.",
    phases: [
      { label: "Inhale", duration: 4, instruction: "Breathe in through nose" },
      { label: "Hold", duration: 7, instruction: "Hold gently" },
      { label: "Exhale", duration: 8, instruction: "Slow exhale through mouth" },
    ],
  },
  {
    id: "coherent",
    name: "Coherent Breathing",
    description: "5.5 breaths per minute for optimal heart rate variability.",
    phases: [
      { label: "Inhale", duration: 5, instruction: "Slow, steady inhale" },
      { label: "Exhale", duration: 5, instruction: "Slow, steady exhale" },
    ],
  },
];

const BreathingExercise = () => {
  const [selectedPattern, setSelectedPattern] = useState(patterns[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentPhase = selectedPattern.phases[phaseIndex];
  const totalPhaseDuration = currentPhase?.duration ?? 1;

  const stop = useCallback(() => {
    setIsRunning(false);
    setPhaseIndex(0);
    setCountdown(0);
    setCycleCount(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const toggle = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else {
      setIsRunning(true);
      setCountdown(selectedPattern.phases[0].duration);
      setPhaseIndex(0);
    }
  }, [isRunning, selectedPattern]);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setPhaseIndex((pi) => {
            const next = pi + 1;
            if (next >= selectedPattern.phases.length) {
              setCycleCount((c) => c + 1);
              return 0;
            }
            return next;
          });
          return 0; // Will be set properly in the next effect
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, selectedPattern.phases.length]);

  // Set countdown when phase changes
  useEffect(() => {
    if (isRunning) {
      setCountdown(selectedPattern.phases[phaseIndex].duration);
    }
  }, [phaseIndex, isRunning, selectedPattern.phases]);

  // Determine circle scale for the breathing animation
  const getCircleScale = () => {
    if (!isRunning) return 0.6;
    const phase = currentPhase.label.toLowerCase();
    const progress = 1 - countdown / totalPhaseDuration;
    if (phase === "inhale") return 0.6 + 0.4 * progress;
    if (phase === "exhale") return 1.0 - 0.4 * progress;
    return phase === "hold" && phaseIndex === 1 ? 1.0 : 0.6;
  };

  return (
    <div className="space-y-5">
      {/* Pattern selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {patterns.map((p) => (
          <button
            key={p.id}
            onClick={() => { stop(); setSelectedPattern(p); }}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              selectedPattern.id === p.id
                ? "bg-primary text-primary-foreground shadow-soft"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{selectedPattern.description}</p>

      {/* Breathing circle */}
      <div className="flex flex-col items-center py-6">
        <div className="relative flex h-52 w-52 items-center justify-center">
          {/* Outer glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/10"
            animate={{ scale: getCircleScale() * 1.15, opacity: isRunning ? 0.4 : 0.2 }}
            transition={{ duration: isRunning ? 0.9 : 0.3, ease: "easeInOut" }}
          />
          {/* Main circle */}
          <motion.div
            className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20"
            animate={{ scale: getCircleScale(), opacity: isRunning ? 1 : 0.7 }}
            transition={{ duration: isRunning ? 0.9 : 0.3, ease: "easeInOut" }}
          />
          {/* Center content */}
          <div className="relative z-10 text-center">
            <AnimatePresence mode="wait">
              {isRunning ? (
                <motion.div
                  key={`${phaseIndex}-${cycleCount}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <p className="text-4xl font-bold text-foreground tabular-nums">{countdown}</p>
                  <p className="mt-1 text-sm font-semibold text-primary">{currentPhase.label}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{currentPhase.instruction}</p>
                </motion.div>
              ) : (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-muted-foreground"
                >
                  Tap to begin
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Cycle counter */}
        {cycleCount > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {cycleCount} cycle{cycleCount !== 1 ? "s" : ""} completed
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={toggle}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft transition-all hover:opacity-90 active:scale-95"
          aria-label={isRunning ? "Pause" : "Start"}
        >
          {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
        </button>
        {(isRunning || cycleCount > 0) && (
          <button
            onClick={stop}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-all hover:text-foreground active:scale-95"
            aria-label="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default BreathingExercise;
