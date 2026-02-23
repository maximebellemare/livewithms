import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CloudRain, ChevronRight, ChevronLeft, RotateCcw, Sparkles } from "lucide-react";

const CATEGORIES = [
  { emoji: "🏥", label: "Health / MS" },
  { emoji: "💼", label: "Work / Career" },
  { emoji: "👪", label: "Relationships" },
  { emoji: "💰", label: "Finances" },
  { emoji: "🌀", label: "Future / Uncertainty" },
  { emoji: "😓", label: "Self-worth" },
  { emoji: "🏠", label: "Daily life" },
  { emoji: "❓", label: "Other" },
];

const CONTROL_OPTIONS = [
  { label: "Fully in my control", value: "full" },
  { label: "Partly in my control", value: "partial" },
  { label: "Not in my control", value: "none" },
];

interface Step {
  title: string;
  instruction: string;
  type: "write" | "category" | "control" | "action" | "summary";
  placeholder?: string;
}

const STEPS: Step[] = [
  {
    title: "Name the Worry",
    instruction: "Write down the anxious thought exactly as it appears in your mind — no filter, no judgment.",
    type: "write",
    placeholder: "e.g. I'm afraid my symptoms will get worse and I won't be able to work…",
  },
  {
    title: "Categorise",
    instruction: "What area of life does this worry belong to?",
    type: "category",
  },
  {
    title: "Control Check",
    instruction: "How much of this worry is within your control right now?",
    type: "control",
  },
  {
    title: "Challenge It",
    instruction: "What evidence do you have that this worry is definitely true? What evidence says otherwise?",
    type: "write",
    placeholder: "e.g. My last MRI was stable. My neurologist said things look okay…",
  },
  {
    title: "One Small Action",
    instruction: "If there's something you can do about this, what is the smallest next step? If not, what can you do to let it go for now?",
    type: "action",
    placeholder: "e.g. Schedule a call with my doctor to ask about this / Practice letting go with a deep breath…",
  },
  {
    title: "Worry Contained",
    instruction: "You gave this worry its time. Now it's time to close the container and move on with your day.",
    type: "summary",
  },
];

export function detectWorryTime(content: string): boolean {
  const lower = content.toLowerCase();
  return (
    /worry\s*time\s*(exercise|session|technique|practice)?/i.test(lower) ||
    /contain(ing|ment)?\s*(your|my|the)?\s*(worr|anxi)/i.test(lower) ||
    (lower.includes("worry") && (lower.includes("contain") || lower.includes("structured") || lower.includes("exercise"))) ||
    (lower.includes("anxious thoughts") && (lower.includes("process") || lower.includes("manage") || lower.includes("contain")))
  );
}

const WorryTimeWidget = () => {
  const [stepIdx, setStepIdx] = useState(0);
  const [category, setCategory] = useState<string | null>(null);
  const [control, setControl] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string[]>(STEPS.map(() => ""));
  const [done, setDone] = useState(false);

  const current = STEPS[stepIdx];

  const canAdvance =
    current.type === "write" || current.type === "action"
      ? answers[stepIdx]?.trim().length > 0
      : current.type === "category"
      ? category !== null
      : current.type === "control"
      ? control !== null
      : true;

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
    setCategory(null);
    setControl(null);
    setAnswers(STEPS.map(() => ""));
    setDone(false);
  };

  const selectedCategory = CATEGORIES.find((c) => c.label === category);
  const selectedControl = CONTROL_OPTIONS.find((c) => c.value === control);

  return (
    <div className="mt-3 rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/30">
        <CloudRain className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-foreground">Worry Time Exercise</span>
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

              {(current.type === "write" || current.type === "action") && (
                <textarea
                  value={answers[stepIdx]}
                  onChange={(e) => updateAnswer(e.target.value)}
                  placeholder={current.placeholder}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              )}

              {current.type === "category" && (
                <div className="grid grid-cols-2 gap-1.5">
                  {CATEGORIES.map((c) => {
                    const active = category === c.label;
                    return (
                      <button
                        key={c.label}
                        onClick={() => setCategory(c.label)}
                        className={`flex items-center gap-2 rounded-xl py-2 px-3 border transition-all active:scale-95 text-left ${
                          active
                            ? "bg-primary/10 border-primary text-foreground"
                            : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        <span className="text-base">{c.emoji}</span>
                        <span className="text-[11px] font-medium">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {current.type === "control" && (
                <div className="space-y-2">
                  {CONTROL_OPTIONS.map((opt) => {
                    const active = control === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setControl(opt.value)}
                        className={`w-full rounded-xl py-2.5 px-4 border transition-all active:scale-[0.98] text-left ${
                          active
                            ? "bg-primary/10 border-primary text-foreground"
                            : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        <span className="text-xs font-medium">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {current.type === "summary" && (
                <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 space-y-3">
                  {answers[0]?.trim() && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">The worry</p>
                      <p className="text-xs text-foreground leading-relaxed italic">"{answers[0]}"</p>
                    </div>
                  )}
                  {selectedCategory && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Category</p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                        {selectedCategory.emoji} {selectedCategory.label}
                      </span>
                    </div>
                  )}
                  {selectedControl && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Control</p>
                      <p className="text-xs text-foreground">{selectedControl.label}</p>
                    </div>
                  )}
                  {answers[4]?.trim() && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">My next step</p>
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
              <p className="text-sm font-medium text-foreground">Worry contained 🫧</p>
              <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 space-y-2 text-left">
                {answers[0]?.trim() && (
                  <p className="text-xs text-foreground leading-relaxed italic">"{answers[0].slice(0, 100)}{answers[0].length > 100 ? "…" : ""}"</p>
                )}
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                    {selectedCategory.emoji} {selectedCategory.label}
                  </span>
                )}
                {answers[4]?.trim() && (
                  <p className="text-xs text-muted-foreground">Next step: {answers[4].slice(0, 80)}{answers[4].length > 80 ? "…" : ""}</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                You gave this worry its time and attention. Now, gently close the container and return to the present moment.
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

export default WorryTimeWidget;
