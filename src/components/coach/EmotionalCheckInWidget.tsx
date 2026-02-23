import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeartPulse, ChevronRight, ChevronLeft, RotateCcw, Sparkles } from "lucide-react";

const EMOTIONS = [
  { emoji: "😢", label: "Sad" },
  { emoji: "😰", label: "Anxious" },
  { emoji: "😤", label: "Frustrated" },
  { emoji: "😔", label: "Hopeless" },
  { emoji: "😶", label: "Numb" },
  { emoji: "😌", label: "Calm" },
  { emoji: "🥲", label: "Bittersweet" },
  { emoji: "😊", label: "Grateful" },
  { emoji: "💪", label: "Determined" },
  { emoji: "😴", label: "Exhausted" },
  { emoji: "🤔", label: "Confused" },
  { emoji: "😠", label: "Angry" },
];

const INTENSITY_LABELS = ["Barely there", "Mild", "Moderate", "Strong", "Overwhelming"];

interface Step {
  title: string;
  instruction: string;
  type: "select" | "intensity" | "write" | "summary";
  placeholder?: string;
}

const STEPS: Step[] = [
  {
    title: "Pause",
    instruction: "Close your eyes for a moment. Take one slow breath. Now — what are you feeling right now?",
    type: "select",
  },
  {
    title: "How Strong?",
    instruction: "How intense does this feeling seem right now?",
    type: "intensity",
  },
  {
    title: "Where Do You Feel It?",
    instruction: "Can you notice where this emotion lives in your body? Chest, stomach, jaw, shoulders?",
    placeholder: "e.g. There's tightness in my chest and my shoulders feel heavy…",
    type: "write",
  },
  {
    title: "What's Behind It?",
    instruction: "Without judgement — what might be driving this feeling today?",
    placeholder: "e.g. I'm worried about my next appointment…",
    type: "write",
  },
  {
    title: "Gentle Response",
    instruction: "If a friend told you they felt this way, what would you say to them?",
    placeholder: "e.g. It's okay to feel this way. You're doing your best…",
    type: "write",
  },
  {
    title: "Check-In Complete",
    instruction: "Here's what you shared. Naming emotions takes courage — you just did something brave.",
    type: "summary",
  },
];

export function detectEmotionalCheckIn(content: string): boolean {
  const lower = content.toLowerCase();
  return (
    /emotional?\s*(check[- ]?in|inventory|awareness|processing)/i.test(lower) ||
    (lower.includes("emotion") && (lower.includes("name") || lower.includes("process") || lower.includes("identify") || lower.includes("check"))) ||
    (lower.includes("feeling") && lower.includes("check") && lower.includes("in"))
  );
}

const EmotionalCheckInWidget = () => {
  const [stepIdx, setStepIdx] = useState(0);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [intensity, setIntensity] = useState(2);
  const [answers, setAnswers] = useState<string[]>(STEPS.map(() => ""));
  const [done, setDone] = useState(false);

  const current = STEPS[stepIdx];

  const canAdvance =
    current.type === "select"
      ? selectedEmotions.length >= 1
      : current.type === "intensity"
      ? true
      : current.type === "summary"
      ? true
      : answers[stepIdx]?.trim().length > 0;

  const haptic = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(10);
  }, []);

  const toggleEmotion = (label: string) => {
    setSelectedEmotions((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : prev.length < 3 ? [...prev, label] : prev
    );
  };

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
    setSelectedEmotions([]);
    setIntensity(2);
    setAnswers(STEPS.map(() => ""));
    setDone(false);
  };

  const selectedWithEmoji = EMOTIONS.filter((e) => selectedEmotions.includes(e.label));

  return (
    <div className="mt-3 rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-secondary/30">
        <HeartPulse className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-foreground">Emotional Check-In</span>
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

              {current.type === "select" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-1.5">
                    {EMOTIONS.map((e) => {
                      const active = selectedEmotions.includes(e.label);
                      return (
                        <button
                          key={e.label}
                          onClick={() => toggleEmotion(e.label)}
                          className={`flex flex-col items-center gap-0.5 rounded-xl py-2 border transition-all active:scale-95 ${
                            active
                              ? "bg-primary/10 border-primary text-foreground"
                              : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          <span className="text-lg">{e.emoji}</span>
                          <span className="text-[10px] font-medium">{e.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {selectedEmotions.length}/3 selected (pick 1–3)
                  </p>
                </div>
              )}

              {current.type === "intensity" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {INTENSITY_LABELS.map((label, i) => (
                      <button
                        key={i}
                        onClick={() => setIntensity(i)}
                        className={`flex-1 rounded-lg py-2 text-center border transition-all active:scale-95 ${
                          i === intensity
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        <span className="text-sm font-semibold">{i + 1}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-xs text-muted-foreground font-medium">
                    {INTENSITY_LABELS[intensity]}
                  </p>
                </div>
              )}

              {current.type === "write" && (
                <textarea
                  value={answers[stepIdx]}
                  onChange={(e) => updateAnswer(e.target.value)}
                  placeholder={current.placeholder}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              )}

              {current.type === "summary" && (
                <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">Feeling</p>
                    <div className="flex gap-1.5">
                      {selectedWithEmoji.map((e) => (
                        <span key={e.label} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                          {e.emoji} {e.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Intensity</p>
                    <p className="text-xs text-foreground">{INTENSITY_LABELS[intensity]} ({intensity + 1}/5)</p>
                  </div>
                  {answers[2]?.trim() && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">In my body</p>
                      <p className="text-xs text-foreground leading-relaxed">{answers[2]}</p>
                    </div>
                  )}
                  {answers[4]?.trim() && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">My gentle response</p>
                      <p className="text-xs text-foreground leading-relaxed italic">"{answers[4]}"</p>
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
              <p className="text-sm font-medium text-foreground">Emotions acknowledged 💜</p>
              <div className="rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 space-y-2 text-left">
                <div className="flex gap-1.5">
                  {selectedWithEmoji.map((e) => (
                    <span key={e.label} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                      {e.emoji} {e.label}
                    </span>
                  ))}
                </div>
                {answers[4]?.trim() && (
                  <p className="text-xs text-foreground leading-relaxed italic">"{answers[4]}"</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                You can't always control what you feel — but naming it gives you power over how you respond.
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

export default EmotionalCheckInWidget;
