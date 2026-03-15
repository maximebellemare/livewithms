import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipForward, RotateCcw, Eye, Volume2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import StepIndicator from "@/components/StepIndicator";
import { Switch } from "@/components/ui/switch";
import { useVoiceNarration } from "@/components/nervous-system/useVoiceNarration";

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
  const narration = useVoiceNarration();

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
      narration.speak("Scan complete. Take a moment to notice how your whole body feels.");
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
  }, [regionIdx, clearTimer, narration]);

  // Voice narration on region change
  useEffect(() => {
    if (phase === "scanning" && region) {
      narration.speak(`${region.name}. ${region.instruction}`);
    }
  }, [regionIdx, phase]);

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
    narration.stop();
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
          <p className="text-xs text-muted-foreground">{BODY_REGIONS.length} regions · ~{Math.round(totalDuration / 60)} min</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 py-2">
            {/* Intro explanation */}
            <div className="rounded-lg bg-primary/5 border border-primary/10 px-4 py-3">
              <p className="text-xs text-muted-foreground leading-relaxed text-center">
                This exercise helps you slowly bring attention to different parts of your body to release tension.
              </p>
            </div>

            {/* How it works — 3 steps */}
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground text-center uppercase tracking-wide">How it works</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { step: 1, text: "Get comfortable & close your eyes" },
                  { step: 2, text: "Follow each body region at your pace" },
                  { step: 3, text: "Notice sensations without judgment" },
                ].map(({ step, text }) => (
                  <div key={step} className="flex flex-col items-center gap-1.5 rounded-lg bg-secondary/50 px-2 py-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {step}
                    </span>
                    <p className="text-[10px] text-muted-foreground text-center leading-snug">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed text-center">
              Find a comfortable position and take a few deep breaths before beginning.
            </p>

            {/* Voice guide toggle */}
            {narration.supported && (
              <div className="flex items-center justify-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">Voice guide</span>
                </div>
                <Switch checked={narration.enabled} onCheckedChange={narration.setEnabled} />
              </div>
            )}

            <div className="text-center">
              <button onClick={start} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-soft active:scale-95 transition-transform">
                <Play className="h-4 w-4" /> Begin Scan
              </button>
            </div>
          </motion.div>
        )}

        {(phase === "scanning" || phase === "transition") && (
          <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Step indicator */}
            <StepIndicator current={regionIdx + 1} total={BODY_REGIONS.length} label="Body Scan" />

            {/* Region label & instruction */}
            <AnimatePresence mode="wait">
              <motion.div
                key={regionIdx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                className="text-center space-y-1.5"
              >
                <p className="text-base font-semibold text-foreground">{region.name}</p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-[260px] mx-auto">{region.instruction}</p>
              </motion.div>
            </AnimatePresence>

            {/* Region timer */}
            <Progress value={pct} className="h-1.5" />
            <p className="text-[11px] text-muted-foreground text-center tabular-nums">{region.duration - elapsed}s remaining</p>

            {/* Controls */}
            <div className="flex justify-center gap-3">
              <button onClick={() => setIsPaused((p) => !p)} className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary text-foreground active:scale-95 transition-transform" aria-label={isPaused ? "Resume" : "Pause"}>
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
              <button onClick={skip} className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary text-foreground active:scale-95 transition-transform" aria-label="Skip region">
                <SkipForward className="h-4 w-4" />
              </button>
            </div>

            {/* Region dots */}
            <div className="flex justify-center gap-1 flex-wrap">
              {BODY_REGIONS.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
                  i < regionIdx ? "w-1.5 bg-primary" : i === regionIdx ? "w-4 bg-primary/60 animate-pulse" : "w-1.5 bg-muted"
                }`} />
              ))}
            </div>

            {/* Overall progress */}
            <p className="text-[11px] text-muted-foreground text-center">{Math.round(overallProgress)}% complete</p>
          </motion.div>
        )}

        {phase === "complete" && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-3 py-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <span className="text-2xl">🧘</span>
            </div>
            <p className="text-sm font-semibold text-foreground">Scan Complete</p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[240px] mx-auto">
              Take a moment to notice how your whole body feels. Gently open your eyes when you're ready.
            </p>
            <button onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2 text-xs font-medium text-foreground active:scale-95 transition-transform">
              <RotateCcw className="h-3.5 w-3.5" /> Start Over
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BodyScanWidget;
