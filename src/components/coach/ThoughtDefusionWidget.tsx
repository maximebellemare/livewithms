import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, ChevronRight, ChevronLeft, RotateCcw, Sparkles } from "lucide-react";

const TECHNIQUES = [
  { emoji: "🍃", label: "Leaves on a stream", description: "Place each thought on a leaf and watch it float downstream." },
  { emoji: "☁️", label: "Clouds in the sky", description: "See thoughts as clouds drifting across the sky — you are the sky, not the clouds." },
  { emoji: "🚂", label: "Train carriages", description: "Thoughts are carriages on a train passing through — you're on the platform, watching." },
  { emoji: "📺", label: "Subtitles on a screen", description: "Imagine your thoughts as subtitles scrolling across a TV screen." },
];

interface Step {
  title: string;
  instruction: string;
  type: "write" | "technique" | "rewrite" | "observe" | "summary";
  placeholder?: string;
}

const STEPS: Step[] = [
  {
    title: "Catch the Thought",
    instruction: "What thought keeps pulling at you right now? Write it down exactly as your mind says it.",
    type: "write",
    placeholder: "e.g. I'm never going to get better…",
  },
  {
    title: "Name It",
    instruction: "Now rewrite the thought with a prefix: \"I notice I'm having the thought that…\"",
    type: "rewrite",
    placeholder: "I notice I'm having the thought that…",
  },
  {
    title: "Pick a Technique",
    instruction: "Choose a defusion technique to create distance between you and this thought.",
    type: "technique",
  },
  {
    title: "Observe",
    instruction: "Close your eyes for 30 seconds. Visualise using your chosen technique. Watch the thought without grabbing onto it. When you're ready, describe what you noticed.",
    type: "observe",
    placeholder: "e.g. The thought felt less urgent after a few seconds. I could see it floating away…",
  },
  {
    title: "Rate the Grip",
    instruction: "How tightly does this thought hold you now compared to before? Has anything shifted?",
    type: "write",
    placeholder: "e.g. It still feels present but lighter — like background noise rather than a siren…",
  },
  {
    title: "Defusion Complete",
    instruction: "You are not your thoughts. You are the awareness behind them.",
    type: "summary",
  },
];

export function detectThoughtDefusion(content: string): boolean {
  const lower = content.toLowerCase();
  return (
    /thought\s*defusion/i.test(lower) ||
    /cognitive\s*defusion/i.test(lower) ||
    (lower.includes("defusion") && (lower.includes("exercise") || lower.includes("technique") || lower.includes("practice"))) ||
    (lower.includes("observe") && lower.includes("thought") && (lower.includes("without") || lower.includes("distance") || lower.includes("let go"))) ||
    (lower.includes("leaves") && lower.includes("stream") && lower.includes("thought"))
  );
}

const ThoughtDefusionWidget = () => {
  const [stepIdx, setStepIdx] = useState(0);
  const [technique, setTechnique] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string[]>(STEPS.map(() => ""));
  const [done, setDone] = useState(false);

  const current = STEPS[stepIdx];

  const canAdvance =
    current.type === "technique"
      ? technique !== null
      : current.type === "summary"
      ? true
      : answers[stepIdx]?.trim().length > 0;

  const haptic = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(10);
  }, []);

  const updateAnswer = (value: string) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[stepIdx] = value;
      return next;
    });
  };

  const next = () => {
    haptic();
    if (stepIdx + 1 >= STEPS.length) setDone(true);
    else setStepIdx((i) => i + 1);
  };

  const prev = () => {
    haptic();
    if (stepIdx > 0) setStepIdx((i) => i - 1);
  };

  const reset = () => {
    setStepIdx(0);
    setTechnique(null);
    setAnswers(STEPS.map(() => ""));
    setDone(false);
  };

  const selectedTechnique = TECHNIQUES.find((t) => t.label === technique);

  return (
    <div className="mt-3 rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/30">
        <Eye className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-foreground">Thought Defusion</span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {done ? "Complete" : `${stepIdx + 1} / ${STEPS.length}`}
        </span>
      </div>

      <div className="px-4 py-4">
        <AnimatePresence mode="wait">
          {!done && (
            <motion.div
              key={stepIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
                {current.title}
              </p>
              <p className="text-xs text-foreground leading-relaxed">{current.instruction}</p>

              {(current.type === "write" || current.type === "rewrite" || current.type === "observe") && (
                <textarea
                  value={answers[stepIdx]}
                  onChange={(e) => updateAnswer(e.target.value)}
                  placeholder={current.placeholder}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              )}

              {current.type === "technique" && (
                <div className="space-y-2">
                  {TECHNIQUES.map((t) => {
                    const active = technique === t.label;
                    return (
                      <button
                        key={t.label}
                        onClick={() => setTechnique(t.label)}
                        className={`w-full flex items-start gap-3 rounded-xl py-2.5 px-3 border transition-all active:scale-[0.98] text-left ${
                          active
                            ? "bg-primary/10 border-primary text-foreground"
                            : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        <span className="text-lg mt-0.5">{t.emoji}</span>
                        <div>
                          <span className="text-xs font-medium block">{t.label}</span>
                          <span className="text-[10px] text-muted-foreground leading-relaxed">{t.description}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {current.type === "summary" && (
                <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 space-y-3">
                  {answers[0]?.trim() && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Original thought</p>
                      <p className="text-xs text-foreground leading-relaxed italic">"{answers[0]}"</p>
                    </div>
                  )}
                  {answers[1]?.trim() && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Reframed</p>
                      <p className="text-xs text-foreground leading-relaxed">{answers[1]}</p>
                    </div>
                  )}
                  {selectedTechnique && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Technique</p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                        {selectedTechnique.emoji} {selectedTechnique.label}
                      </span>
                    </div>
                  )}
                  {answers[4]?.trim() && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">How it shifted</p>
                      <p className="text-xs text-foreground leading-relaxed">{answers[4]}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {done && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-3"
            >
              <div className="mx-auto h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">Thought observed 🍃</p>
              <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 space-y-2 text-left">
                {answers[0]?.trim() && (
                  <p className="text-xs text-foreground leading-relaxed italic">"{answers[0].slice(0, 100)}{answers[0].length > 100 ? "…" : ""}"</p>
                )}
                {selectedTechnique && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                    {selectedTechnique.emoji} {selectedTechnique.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                You are not your thoughts. You are the awareness that notices them.
              </p>
              <button
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary transition-colors"
              >
                <RotateCcw className="h-3 w-3" /> Repeat
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!done && (
          <div className="flex justify-center gap-1.5 pt-3">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i < stepIdx ? "bg-primary" : i === stepIdx ? "bg-primary/60" : "bg-muted"
                }`}
              />
            ))}
          </div>
        )}

        {!done && (
          <div className="flex items-center justify-center gap-2 pt-3">
            {stepIdx > 0 && (
              <button
                onClick={prev}
                className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-secondary transition-colors"
              >
                <ChevronLeft className="h-3 w-3" /> Back
              </button>
            )}
            {canAdvance && (
              <button
                onClick={next}
                className="flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-[11px] font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {stepIdx === 0 ? "Begin" : stepIdx + 1 >= STEPS.length ? "Finish" : "Next"}
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ThoughtDefusionWidget;
