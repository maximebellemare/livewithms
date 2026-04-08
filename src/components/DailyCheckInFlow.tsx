import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckInMood, CheckInData } from "@/hooks/useDailyCheckIn";
import { useNavigate } from "react-router-dom";

const MOOD_OPTIONS: { key: CheckInMood; emoji: string; label: string; sublabel: string }[] = [
  { key: "good", emoji: "😊", label: "Good", sublabel: "Feeling positive" },
  { key: "okay", emoji: "😐", label: "Okay", sublabel: "Somewhere in between" },
  { key: "struggling", emoji: "😞", label: "Struggling", sublabel: "Having a hard time" },
  { key: "exhausted", emoji: "😴", label: "Exhausted", sublabel: "Running on empty" },
];

const SUGGESTIONS: Record<CheckInMood, { emoji: string; label: string; route: string }[]> = {
  good: [
    { emoji: "📝", label: "Capture what's working in your journal", route: "/journal" },
    { emoji: "🧠", label: "Challenge your brain with a quick game", route: "/cognitive" },
    { emoji: "💪", label: "Build on this energy with some movement", route: "/lifestyle" },
  ],
  okay: [
    { emoji: "🌿", label: "Try a short grounding exercise", route: "/nervous-system" },
    { emoji: "📝", label: "Write down a few thoughts", route: "/journal" },
    { emoji: "📊", label: "See how your week is looking", route: "/insights" },
  ],
  struggling: [
    { emoji: "💬", label: "Talk it through with your coach", route: "/coach" },
    { emoji: "🫁", label: "Take a few slow, deep breaths", route: "/nervous-system" },
    { emoji: "📖", label: "Read something that might help", route: "/learn" },
  ],
  exhausted: [
    { emoji: "🫁", label: "A gentle breathing exercise", route: "/nervous-system" },
    { emoji: "🔋", label: "Simplify your day with energy planning", route: "/energy-budget" },
    { emoji: "💬", label: "Let your coach know how you're feeling", route: "/coach" },
  ],
};

const transition = { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] };

interface DailyCheckInFlowProps {
  onComplete: (mood: CheckInMood) => CheckInData;
  onDismiss?: () => void;
  variant?: "modal" | "card";
}

const DailyCheckInFlow = ({ onComplete, onDismiss, variant = "card" }: DailyCheckInFlowProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"ask" | "response" | "suggest">("ask");
  const [selectedMood, setSelectedMood] = useState<CheckInMood | null>(null);
  const [aiResponse, setAiResponse] = useState("");
  const [hoveredMood, setHoveredMood] = useState<CheckInMood | null>(null);

  const handleSelect = (mood: CheckInMood) => {
    setSelectedMood(mood);
    const result = onComplete(mood);
    setAiResponse(result.aiResponse);
    setTimeout(() => setStep("response"), 150);
  };

  const isModal = variant === "modal";

  return (
    <div className={isModal ? "" : "rounded-2xl border border-primary/10 bg-gradient-to-b from-primary/[0.04] to-primary/[0.08] p-6"}>
      <AnimatePresence mode="wait">
        {step === "ask" && (
          <motion.div
            key="ask"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={transition}
            className="space-y-5 text-center"
          >
            <div className="space-y-2">
              <p className="text-xl font-semibold text-foreground tracking-tight">
                How are you feeling today?
              </p>
              <p className="text-sm text-muted-foreground">
                Take a moment. There's no wrong answer.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {MOOD_OPTIONS.map(({ key, emoji, label, sublabel }) => (
                <button
                  key={key}
                  onClick={() => handleSelect(key)}
                  onMouseEnter={() => setHoveredMood(key)}
                  onMouseLeave={() => setHoveredMood(null)}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-sm active:scale-[0.96]"
                >
                  <span className="text-4xl transition-transform duration-200 group-hover:scale-110">
                    {emoji}
                  </span>
                  <div>
                    <span className="text-sm font-semibold text-foreground">{label}</span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{sublabel}</p>
                  </div>
                </button>
              ))}
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors pt-1"
              >
                I'll check in later
              </button>
            )}
          </motion.div>
        )}

        {step === "response" && selectedMood && (
          <motion.div
            key="response"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ ...transition, duration: 0.4 }}
            className="space-y-5 text-center py-2"
          >
            <motion.span
              className="inline-block text-5xl"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
            >
              {MOOD_OPTIONS.find((m) => m.key === selectedMood)?.emoji}
            </motion.span>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="space-y-1"
            >
              <p className="text-sm text-muted-foreground font-medium">
                {MOOD_OPTIONS.find((m) => m.key === selectedMood)?.label}
              </p>
              <p className="text-[15px] text-foreground leading-relaxed max-w-[280px] mx-auto font-medium">
                {aiResponse}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="space-y-2 pt-1"
            >
              <button
                onClick={() => setStep("suggest")}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/15 transition-colors"
              >
                Want some ideas for today?
              </button>
              {isModal && (
                <button
                  onClick={onDismiss}
                  className="block mx-auto text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors"
                >
                  Continue to dashboard
                </button>
              )}
            </motion.div>
          </motion.div>
        )}

        {step === "suggest" && selectedMood && (
          <motion.div
            key="suggest"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={transition}
            className="space-y-4"
          >
            <p className="text-sm font-semibold text-foreground text-center">
              A few gentle ideas for today
            </p>
            <div className="space-y-2">
              {SUGGESTIONS[selectedMood].map(({ emoji, label, route }, i) => (
                <motion.button
                  key={route}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                  onClick={() => {
                    onDismiss?.();
                    navigate(route);
                  }}
                  className="w-full flex items-center gap-3.5 rounded-xl border border-border/60 bg-card px-4 py-3.5 text-left transition-all hover:border-primary/25 hover:bg-primary/[0.03] active:scale-[0.98]"
                >
                  <span className="text-xl flex-shrink-0">{emoji}</span>
                  <span className="text-[13px] font-medium text-foreground leading-snug">{label}</span>
                </motion.button>
              ))}
            </div>
            <button
              onClick={onDismiss}
              className="block mx-auto text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors pt-1"
            >
              {isModal ? "Continue to dashboard" : "Maybe later"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DailyCheckInFlow;
