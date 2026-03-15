import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSoundCues } from "./useSoundCues";
import SoundCueControls from "./SoundCueControls";

const DURATIONS = [3, 5, 10, 15, 20] as const;

const MindfulnessTimer = () => {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(5);
  const [secondsLeft, setSecondsLeft] = useState<number>(5 * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sound = useSoundCues();

  // Sync timer when duration pill changes (only when not running)
  const handleSelect = useCallback((min: number) => {
    if (running) return;
    setSelectedMinutes(min);
    setSecondsLeft(min * 60);
    setFinished(false);
  }, [running]);

  // Core countdown
  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        sound.onTick(prev - 1);
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          setFinished(true);
          sound.onEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, sound]);

  const reset = () => {
    setRunning(false);
    setFinished(false);
    setSecondsLeft(selectedMinutes * 60);
    sound.cleanup();
  };

  const toggleRunning = () => {
    if (finished) { reset(); return; }
    if (!running && secondsLeft === selectedMinutes * 60) {
      // Fresh start
      sound.onStart();
      sound.startAmbientLoop();
    }
    setRunning((r) => !r);
  };

  const totalSeconds = selectedMinutes * 60;
  const progress = 1 - secondsLeft / totalSeconds;
  const displayMin = Math.floor(secondsLeft / 60);
  const displaySec = secondsLeft % 60;

  // Circle progress
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference * (1 - progress);

  return (
    <div className="space-y-5">
      {/* Benefits & instructions */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-primary" />
          Why Mindfulness Meditation?
        </h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Regular mindfulness practice can reduce stress hormones, ease MS-related fatigue, and improve emotional resilience. Even a few minutes of focused stillness helps calm an overactive nervous system and promotes better sleep.
        </p>
        <div className="rounded-xl bg-secondary/60 p-3 space-y-1.5">
          <p className="text-xs font-medium text-foreground">How to practice:</p>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside leading-relaxed">
            <li>Find a comfortable position — sitting or lying down</li>
            <li>Close your eyes and take three slow, deep breaths</li>
            <li>Let your breathing return to its natural rhythm</li>
            <li>Notice sensations, sounds, and thoughts without judgment</li>
            <li>When your mind wanders, gently return to your breath</li>
          </ol>
        </div>
      </div>

      {/* Duration selector */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground text-center">Choose your session length</p>
        <div className="flex justify-center gap-2">
          {DURATIONS.map((min) => (
            <button
              key={min}
              onClick={() => handleSelect(min)}
              disabled={running}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                selectedMinutes === min
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-40"
              }`}
            >
              {min}m
            </button>
          ))}
        </div>
      </div>

      {/* Sound cues */}
      <SoundCueControls
        enabled={sound.enabled}
        onEnabledChange={sound.setEnabled}
        ambientOn={sound.ambientOn}
        onToggleAmbient={sound.toggleAmbient}
      />

      {/* Timer circle */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
          <svg width={220} height={220} className="absolute inset-0 -rotate-90">
            {/* Track */}
            <circle
              cx={110} cy={110} r={radius}
              fill="none"
              stroke="hsl(var(--secondary))"
              strokeWidth={6}
            />
            {/* Progress */}
            <motion.circle
              cx={110} cy={110} r={radius}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              initial={false}
              animate={{ strokeDashoffset: strokeOffset }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </svg>

          {/* Inner content */}
          <div className="relative z-10 flex flex-col items-center gap-1">
            <AnimatePresence mode="wait">
              {finished ? (
                <motion.div
                  key="done"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="text-center"
                >
                  <p className="text-lg font-bold text-primary">Well done 🧘</p>
                  <p className="text-xs text-muted-foreground mt-1">Take a moment before moving on</p>
                </motion.div>
              ) : (
                <motion.div
                  key="timer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <p className="text-4xl font-bold tabular-nums text-foreground tracking-tight">
                    {String(displayMin).padStart(2, "0")}:{String(displaySec).padStart(2, "0")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {running ? "Focus on your breath…" : "Press play to begin"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={reset}
            disabled={secondsLeft === totalSeconds && !finished}
            className="rounded-full p-3 bg-secondary text-muted-foreground transition-all hover:text-foreground disabled:opacity-30"
            aria-label="Reset timer"
          >
            <RotateCcw className="h-5 w-5" />
          </button>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={toggleRunning}
            className="rounded-full p-5 bg-primary text-primary-foreground shadow-soft transition-all hover:opacity-90"
            aria-label={running ? "Pause" : "Play"}
          >
            {running ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
          </motion.button>

          {/* Spacer for symmetry */}
          <div className="w-11" />
        </div>
      </div>
    </div>
  );
};

export default MindfulnessTimer;
