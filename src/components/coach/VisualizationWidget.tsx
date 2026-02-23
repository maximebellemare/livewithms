import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, RotateCcw, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const SCENES = [
  {
    name: "Arrival",
    prompt: "Close your eyes. Take three slow breaths. Imagine yourself standing at the edge of a peaceful place.",
    duration: 20,
  },
  {
    name: "The Path",
    prompt: "You see a gentle path ahead. Feel the soft ground beneath your feet as you begin to walk.",
    duration: 20,
  },
  {
    name: "Sounds",
    prompt: "Listen carefully. Maybe you hear birdsong, flowing water, or a gentle breeze through leaves.",
    duration: 20,
  },
  {
    name: "Warmth",
    prompt: "Feel warm sunlight on your skin. Let it soften any tension in your shoulders and face.",
    duration: 20,
  },
  {
    name: "A Safe Spot",
    prompt: "You find a comfortable place to sit — a mossy rock, a bench, or soft grass. Settle in.",
    duration: 25,
  },
  {
    name: "Breathing with Nature",
    prompt: "Match your breathing to the rhythm of this place. Inhale the calm. Exhale any stress.",
    duration: 25,
  },
  {
    name: "Gratitude",
    prompt: "Think of one thing you're grateful for right now. Hold it gently in your mind.",
    duration: 20,
  },
  {
    name: "Return",
    prompt: "Slowly bring awareness back to your body. Wiggle your fingers and toes. Open your eyes when ready.",
    duration: 20,
  },
];

type Phase = "idle" | "active" | "transition" | "complete";

export const detectVisualization = (content: string): boolean => {
  const lower = content.toLowerCase();
  return (
    /visuali[sz]ation\s*exercise/i.test(lower) ||
    /guided\s*visuali[sz]ation/i.test(lower) ||
    /imagin(e|ing)\s*(a\s*)?calm(ing)?\s*scene/i.test(lower) ||
    /calming\s*scene\s*visuali/i.test(lower) ||
    /visuali[sz]ation\s*meditation/i.test(lower)
  );
};

const VisualizationWidget = () => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [sceneIdx, setSceneIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scene = SCENES[sceneIdx];
  const totalDuration = SCENES.reduce((s, sc) => s + sc.duration, 0);
  const elapsedBefore = SCENES.slice(0, sceneIdx).reduce((s, sc) => s + sc.duration, 0);
  const overallPct = ((elapsedBefore + elapsed) / totalDuration) * 100;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const advance = useCallback(() => {
    clearTimer();
    if (sceneIdx < SCENES.length - 1) {
      setPhase("transition");
      setTimeout(() => {
        setSceneIdx((i) => i + 1);
        setElapsed(0);
        setPhase("active");
      }, 1200);
    } else {
      setPhase("complete");
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
  }, [sceneIdx, clearTimer]);

  useEffect(() => {
    if (phase !== "active" || isPaused) {
      clearTimer();
      return;
    }
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= scene.duration) {
          advance();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    return clearTimer;
  }, [phase, isPaused, scene.duration, advance, clearTimer]);

  const start = () => {
    setSceneIdx(0);
    setElapsed(0);
    setIsPaused(false);
    setPhase("active");
  };

  const reset = () => {
    clearTimer();
    setPhase("idle");
    setSceneIdx(0);
    setElapsed(0);
    setIsPaused(false);
  };

  const pct = scene ? (elapsed / scene.duration) * 100 : 0;

  return (
    <div className="mt-3 rounded-xl border border-border bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Guided Visualization</p>
          <p className="text-[11px] text-muted-foreground">{SCENES.length} scenes · ~{Math.round(totalDuration / 60)} min</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-3 py-2">
            <p className="text-xs text-muted-foreground leading-relaxed">Settle into a comfortable position. This exercise will guide you through a calming scene, one step at a time.</p>
            <button onClick={start} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground active:scale-95 transition-transform">
              <Play className="h-4 w-4" /> Begin Journey
            </button>
          </motion.div>
        )}

        {(phase === "active" || phase === "transition") && (
          <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={sceneIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5 }}
                className="text-center space-y-1.5"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">{scene.name}</p>
                <p className="text-sm text-foreground leading-relaxed max-w-xs mx-auto">{scene.prompt}</p>
              </motion.div>
            </AnimatePresence>

            <Progress value={pct} className="h-1.5" />
            <p className="text-[11px] text-muted-foreground text-center">{scene.duration - elapsed}s</p>

            <div className="flex justify-center gap-3">
              <button onClick={() => setIsPaused((p) => !p)} className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary text-foreground active:scale-95 transition-transform">
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
              <button onClick={() => advance()} className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary text-foreground active:scale-95 transition-transform">
                <SkipForward className="h-4 w-4" />
              </button>
            </div>

            <div className="flex justify-center gap-1">
              {SCENES.map((_, i) => (
                <span key={i} className={`h-2 w-2 rounded-full transition-colors ${i < sceneIdx ? "bg-primary" : i === sceneIdx ? "bg-primary/60 animate-pulse" : "bg-muted"}`} />
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground/60 text-center">{Math.round(overallPct)}% complete</p>
          </motion.div>
        )}

        {phase === "complete" && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-3 py-2">
            <p className="text-sm font-medium text-foreground">Journey Complete ✨</p>
            <p className="text-xs text-muted-foreground leading-relaxed">Take a moment to notice how you feel. Carry this sense of calm with you.</p>
            <button onClick={reset} className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-foreground active:scale-95 transition-transform">
              <RotateCcw className="h-3.5 w-3.5" /> Start Over
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VisualizationWidget;
