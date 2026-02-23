import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, RotateCcw, Eye } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const BODY_REGIONS = [
  { name: "Top of Head", instruction: "Notice any tension in your scalp and crown. Let it soften.", duration: 20 },
  { name: "Forehead & Eyes", instruction: "Relax your brow, let your eyelids feel heavy and at ease.", duration: 20 },
  { name: "Jaw & Mouth", instruction: "Unclench your jaw. Let your tongue rest gently.", duration: 15 },
  { name: "Neck & Throat", instruction: "Feel the weight of your head supported. Release any tightness.", duration: 20 },
  { name: "Shoulders", instruction: "Let your shoulders drop away from your ears. Feel them melt.", duration: 20 },
  { name: "Arms & Hands", instruction: "Notice sensations from upper arms to fingertips. Let them be heavy.", duration: 20 },
  { name: "Chest", instruction: "Feel your breath expanding your chest. Notice the rhythm.", duration: 25 },
  { name: "Stomach", instruction: "Let your belly be soft. Release any holding or bracing.", duration: 20 },
  { name: "Lower Back", instruction: "Bring gentle awareness here. Let tension dissolve.", duration: 20 },
  { name: "Hips & Pelvis", instruction: "Notice where your body meets the surface. Feel grounded.", duration: 15 },
  { name: "Legs", instruction: "Scan from thighs to knees to shins. Let them feel heavy and warm.", duration: 20 },
  { name: "Feet", instruction: "Notice your toes, soles, and heels. Feel connected to the ground.", duration: 20 },
];

type Phase = "idle" | "scanning" | "transition" | "complete";

export const detectBodyScan = (content: string): boolean => {
  const lower = content.toLowerCase();
  return (
    /body\s*scan/i.test(lower) ||
    (/scan.*attention.*body/i.test(lower)) ||
    (/scan.*each.*body\s*(part|region|area)/i.test(lower)) ||
    (/guided\s*body\s*(awareness|meditation)/i.test(lower))
  );
};

const BodyScanWidget = () => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [regionIdx, setRegionIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const region = BODY_REGIONS[regionIdx];
  const totalDuration = BODY_REGIONS.reduce((s, r) => s + r.duration, 0);
  const elapsedBefore = BODY_REGIONS.slice(0, regionIdx).reduce((s, r) => s + r.duration, 0);
  const overallProgress = ((elapsedBefore + elapsed) / totalDuration) * 100;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const advance = useCallback(() => {
    clearTimer();
    if (regionIdx < BODY_REGIONS.length - 1) {
      setPhase("transition");
      setTimeout(() => {
        setRegionIdx((i) => i + 1);
        setElapsed(0);
        setPhase("scanning");
      }, 1200);
    } else {
      setPhase("complete");
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
  }, [regionIdx, clearTimer]);

  useEffect(() => {
    if (phase !== "scanning" || isPaused) {
      clearTimer();
      return;
    }
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= region.duration) {
          advance();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    return clearTimer;
  }, [phase, isPaused, region.duration, advance, clearTimer]);

  const start = () => {
    setRegionIdx(0);
    setElapsed(0);
    setIsPaused(false);
    setPhase("scanning");
  };

  const reset = () => {
    clearTimer();
    setPhase("idle");
    setRegionIdx(0);
    setElapsed(0);
    setIsPaused(false);
  };

  const skip = () => advance();

  const pct = region ? (elapsed / region.duration) * 100 : 0;

  return (
    <div className="mt-3 rounded-xl border border-border bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Eye className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Body Scan Meditation</p>
          <p className="text-[11px] text-muted-foreground">{BODY_REGIONS.length} regions · ~{Math.round(totalDuration / 60)} min</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-3 py-2">
            <p className="text-xs text-muted-foreground leading-relaxed">Find a comfortable position. Close your eyes and take a few deep breaths before beginning.</p>
            <button onClick={start} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground active:scale-95 transition-transform">
              <Play className="h-4 w-4" /> Begin Scan
            </button>
          </motion.div>
        )}

        {(phase === "scanning" || phase === "transition") && (
          <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Region label */}
            <AnimatePresence mode="wait">
              <motion.div
                key={regionIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                className="text-center space-y-1"
              >
                <p className="text-base font-semibold text-foreground">{region.name}</p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">{region.instruction}</p>
              </motion.div>
            </AnimatePresence>

            {/* Region timer */}
            <Progress value={pct} className="h-2" />
            <p className="text-[11px] text-muted-foreground text-center">{region.duration - elapsed}s remaining</p>

            {/* Controls */}
            <div className="flex justify-center gap-3">
              <button onClick={() => setIsPaused((p) => !p)} className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary text-foreground active:scale-95 transition-transform">
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
              <button onClick={skip} className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary text-foreground active:scale-95 transition-transform">
                <SkipForward className="h-4 w-4" />
              </button>
            </div>

            {/* Region dots */}
            <div className="flex justify-center gap-1 flex-wrap">
              {BODY_REGIONS.map((_, i) => (
                <span key={i} className={`h-2 w-2 rounded-full transition-colors ${i < regionIdx ? "bg-primary" : i === regionIdx ? "bg-primary/60 animate-pulse" : "bg-muted"}`} />
              ))}
            </div>

            {/* Overall progress */}
            <p className="text-[10px] text-muted-foreground/60 text-center">{Math.round(overallProgress)}% complete</p>
          </motion.div>
        )}

        {phase === "complete" && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-3 py-2">
            <p className="text-sm font-medium text-foreground">Scan Complete 🧘</p>
            <p className="text-xs text-muted-foreground leading-relaxed">Take a moment to notice how your whole body feels. Gently open your eyes when ready.</p>
            <button onClick={reset} className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-foreground active:scale-95 transition-transform">
              <RotateCcw className="h-3.5 w-3.5" /> Start Over
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BodyScanWidget;
