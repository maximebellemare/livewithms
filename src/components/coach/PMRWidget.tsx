import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, ChevronRight, Check, Zap, ZapOff, Vibrate } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface MuscleGroup {
  name: string;
  instruction: string;
  tenseDuration: number;
  relaxDuration: number;
}

const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
  { name: "Hands", instruction: "Clench both fists as tightly as you can", tenseDuration: 5, relaxDuration: 10 },
  { name: "Arms", instruction: "Bend your elbows and tense your biceps", tenseDuration: 5, relaxDuration: 10 },
  { name: "Shoulders", instruction: "Raise your shoulders up toward your ears", tenseDuration: 5, relaxDuration: 10 },
  { name: "Face", instruction: "Scrunch up your whole face tightly", tenseDuration: 5, relaxDuration: 10 },
  { name: "Chest", instruction: "Take a deep breath and hold, tense your chest", tenseDuration: 5, relaxDuration: 10 },
  { name: "Stomach", instruction: "Tighten your abdominal muscles", tenseDuration: 5, relaxDuration: 10 },
  { name: "Legs", instruction: "Press your thighs together and tense", tenseDuration: 5, relaxDuration: 10 },
  { name: "Feet", instruction: "Curl your toes downward tightly", tenseDuration: 5, relaxDuration: 10 },
];

type Phase = "select" | "idle" | "tense" | "release" | "done";

const PMRWidget = () => {
  const [selected, setSelected] = useState<boolean[]>(ALL_MUSCLE_GROUPS.map(() => true));
  const [difficulty, setDifficulty] = useState(1);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [activeGroups, setActiveGroups] = useState<MuscleGroup[]>(ALL_MUSCLE_GROUPS);
  const [groupIdx, setGroupIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("select");
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState<boolean[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentGroup = activeGroups[groupIdx];
  const totalCompleted = completed.filter(Boolean).length;
  const progress = activeGroups.length > 0 ? totalCompleted / activeGroups.length : 0;
  const allDone = phase === "done";

  const selectedCount = selected.filter(Boolean).length;

  const haptic = useCallback(() => {
    if (hapticEnabled && navigator.vibrate) navigator.vibrate(15);
  }, [hapticEnabled]);

  const toggleGroup = (idx: number) => {
    setSelected((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  const selectAll = () => setSelected(ALL_MUSCLE_GROUPS.map(() => true));
  const selectNone = () => setSelected(ALL_MUSCLE_GROUPS.map(() => false));

  const DIFFICULTY_PRESETS = [
    { label: "Gentle", tense: 3, release: 8 },
    { label: "Standard", tense: 5, release: 10 },
    { label: "Deep", tense: 8, release: 15 },
  ];

  const preset = DIFFICULTY_PRESETS[difficulty];

  const confirmSelection = () => {
    const groups = ALL_MUSCLE_GROUPS
      .filter((_, i) => selected[i])
      .map((g) => ({ ...g, tenseDuration: preset.tense, relaxDuration: preset.release }));
    setActiveGroups(groups);
    setCompleted(groups.map(() => false));
    setGroupIdx(0);
    setPhase("idle");
  };

  // Timer logic
  useEffect(() => {
    if (!running || phase === "idle" || phase === "done" || phase === "select") return;

    intervalRef.current = setInterval(() => {
      setTimer((t) => {
        const next = t - 1;
        if (next <= 0) {
          haptic();
          if (phase === "tense") {
            setPhase("release");
            return currentGroup.relaxDuration;
          } else {
            setCompleted((prev) => {
              const n = [...prev];
              n[groupIdx] = true;
              return n;
            });
            if (groupIdx + 1 >= activeGroups.length) {
              setPhase("done");
              setRunning(false);
              return 0;
            }
            setGroupIdx((i) => i + 1);
            setPhase("tense");
            return activeGroups[groupIdx + 1].tenseDuration;
          }
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, phase, groupIdx, currentGroup, activeGroups, haptic]);

  const start = () => {
    haptic();
    setPhase("tense");
    setTimer(currentGroup.tenseDuration);
    setRunning(true);
  };

  const togglePause = () => {
    haptic();
    setRunning((r) => !r);
  };

  const skip = () => {
    haptic();
    if (intervalRef.current) clearInterval(intervalRef.current);
    setCompleted((prev) => {
      const n = [...prev];
      n[groupIdx] = true;
      return n;
    });
    if (groupIdx + 1 >= activeGroups.length) {
      setPhase("done");
      setRunning(false);
    } else {
      setGroupIdx((i) => i + 1);
      setPhase("tense");
      setTimer(activeGroups[groupIdx + 1].tenseDuration);
    }
  };

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase("select");
    setGroupIdx(0);
    setTimer(0);
    setRunning(false);
    setCompleted([]);
  };

  const CIRCLE_R = 46;
  const CIRCUMFERENCE = 2 * Math.PI * CIRCLE_R;
  const progressOffset = CIRCUMFERENCE * (1 - progress);

  const maxTime = phase === "tense" ? currentGroup?.tenseDuration : currentGroup?.relaxDuration;
  const timerProgress = maxTime && maxTime > 0 ? timer / maxTime : 0;
  const timerOffset = CIRCUMFERENCE * (1 - timerProgress);

  // Selection screen
  if (phase === "select") {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <p className="text-sm font-semibold text-foreground">Choose Muscle Groups</p>
        <p className="text-[11px] text-muted-foreground">Select the areas you'd like to focus on</p>

        <div className="grid grid-cols-2 gap-2 w-full max-w-[280px] mt-1">
          {ALL_MUSCLE_GROUPS.map((g, i) => (
            <button
              key={g.name}
              onClick={() => toggleGroup(i)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all active:scale-95 border ${
                selected[i]
                  ? "bg-primary/10 border-primary/30 text-foreground"
                  : "bg-secondary/50 border-border text-muted-foreground"
              }`}
            >
              <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                selected[i] ? "bg-primary border-primary" : "border-muted-foreground/30"
              }`}>
                {selected[i] && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
              {g.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-1">
          <button onClick={selectAll} className="text-[11px] text-primary hover:underline">Select all</button>
          <span className="text-muted-foreground/40">·</span>
          <button onClick={selectNone} className="text-[11px] text-muted-foreground hover:text-foreground">Clear</button>
        </div>

        {/* Difficulty slider */}
        <div className="w-full max-w-[280px] mt-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-foreground">Intensity</p>
            <p className="text-[11px] text-muted-foreground">{preset.label} · {preset.tense}s tense / {preset.release}s release</p>
          </div>
          <Slider
            value={[difficulty]}
            onValueChange={(v) => setDifficulty(v[0])}
            min={0}
            max={2}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground/60">
            <span>Gentle</span>
            <span>Standard</span>
            <span>Deep</span>
          </div>
        </div>

        {/* Haptic toggle */}
        <div className="w-full max-w-[280px] flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5">
            <Vibrate className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] font-medium text-foreground">Haptic feedback</span>
          </div>
          <Switch checked={hapticEnabled} onCheckedChange={setHapticEnabled} />
        </div>

        <button
          onClick={confirmSelection}
          disabled={selectedCount === 0}
          className="mt-2 flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-40 active:scale-95 transition-all"
        >
          <Play className="h-4 w-4" /> Start ({selectedCount} group{selectedCount !== 1 ? "s" : ""})
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {/* Progress ring */}
      <div className="relative flex items-center justify-center" style={{ width: 120, height: 120 }}>
        <svg width={120} height={120} className="absolute -rotate-90">
          <circle cx={60} cy={60} r={CIRCLE_R} fill="none" stroke="hsl(var(--muted))" strokeWidth={5} />
          {phase === "idle" || allDone ? (
            <circle
              cx={60} cy={60} r={CIRCLE_R}
              fill="none" stroke="hsl(var(--primary))" strokeWidth={5}
              strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={progressOffset}
              style={{ transition: "stroke-dashoffset 0.4s ease" }}
            />
          ) : (
            <circle
              cx={60} cy={60} r={CIRCLE_R}
              fill="none"
              stroke={phase === "tense" ? "hsl(var(--primary))" : "hsl(var(--accent-foreground) / 0.6)"}
              strokeWidth={5} strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE} strokeDashoffset={timerOffset}
              style={{ transition: "stroke-dashoffset 0.3s linear" }}
            />
          )}
        </svg>
        <AnimatePresence mode="wait">
          <motion.div
            key={allDone ? "done" : `${groupIdx}-${phase}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute flex flex-col items-center"
          >
            {allDone ? (
              <>
                <Check className="h-6 w-6 text-primary" />
                <span className="text-xs font-semibold text-foreground mt-1">Relaxed</span>
              </>
            ) : phase === "idle" ? (
              <>
                <Zap className="h-6 w-6 text-primary" />
                <span className="text-xs font-semibold text-foreground mt-1">Ready</span>
              </>
            ) : phase === "tense" ? (
              <>
                <Zap className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold text-foreground">{timer}s</span>
                <span className="text-[10px] text-primary font-medium">TENSE</span>
              </>
            ) : (
              <>
                <ZapOff className="h-6 w-6 text-muted-foreground" />
                <span className="text-lg font-bold text-foreground">{timer}s</span>
                <span className="text-[10px] text-muted-foreground font-medium">RELEASE</span>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Instruction */}
      {!allDone && currentGroup && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${groupIdx}-${phase}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-center gap-1 max-w-[260px]"
          >
            <p className="text-sm font-semibold text-foreground">{currentGroup.name}</p>
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              {phase === "release"
                ? `Now let go… feel the tension melt away from your ${currentGroup.name.toLowerCase()}`
                : currentGroup.instruction}
            </p>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Muscle group dots */}
      <div className="flex items-center gap-1">
        {activeGroups.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              completed[i]
                ? "w-3 bg-primary"
                : i === groupIdx && phase !== "idle"
                ? "w-3 bg-primary/50"
                : "w-1.5 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {allDone
          ? "All muscle groups complete"
          : phase === "idle"
          ? `${activeGroups.length} muscle group${activeGroups.length !== 1 ? "s" : ""} selected`
          : `${currentGroup?.name} — ${groupIdx + 1} of ${activeGroups.length}`}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {phase === "idle" && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={start}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-95 transition-transform"
            aria-label="Start"
          >
            <Play className="h-4 w-4 ml-0.5" />
          </motion.button>
        )}

        {(phase === "tense" || phase === "release") && (
          <>
            <button
              onClick={togglePause}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-95 transition-transform"
              aria-label={running ? "Pause" : "Resume"}
            >
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>
            <button
              onClick={skip}
              className="flex h-9 items-center gap-1 px-3 rounded-full bg-secondary text-muted-foreground hover:text-foreground text-xs font-medium active:scale-95 transition-all"
            >
              Skip <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </>
        )}

        {allDone && (
          <button
            onClick={reset}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground active:scale-95 transition-all"
            aria-label="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export function detectPMR(content: string): boolean {
  const lower = content.toLowerCase();
  return (
    lower.includes("progressive muscle relaxation") ||
    lower.includes("pmr exercise") ||
    (lower.includes("muscle") && lower.includes("relaxation") && (lower.includes("tense") || lower.includes("release") || lower.includes("squeeze"))) ||
    (lower.includes("tense") && lower.includes("release") && lower.includes("muscle"))
  );
}

export default PMRWidget;
