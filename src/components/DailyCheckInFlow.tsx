import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckInMood } from "@/hooks/useDailyCheckIn";
import { useNavigate } from "react-router-dom";

const MOOD_OPTIONS: { key: CheckInMood; emoji: string; label: string }[] = [
  { key: "good", emoji: "😊", label: "Good" },
  { key: "okay", emoji: "😐", label: "Okay" },
  { key: "struggling", emoji: "😞", label: "Struggling" },
  { key: "exhausted", emoji: "😴", label: "Exhausted" },
];

const SUGGESTIONS: Record<CheckInMood, { emoji: string; label: string; route: string }[]> = {
  good: [
    { emoji: "🧠", label: "Try a brain game", route: "/cognitive" },
    { emoji: "📝", label: "Write in your journal", route: "/journal" },
    { emoji: "💪", label: "Log some exercise", route: "/lifestyle" },
  ],
  okay: [
    { emoji: "🌿", label: "A grounding exercise", route: "/nervous-system" },
    { emoji: "📊", label: "Check your insights", route: "/insights" },
    { emoji: "📝", label: "Jot down some thoughts", route: "/journal" },
  ],
  struggling: [
    { emoji: "💬", label: "Talk to your coach", route: "/coach" },
    { emoji: "🫁", label: "Try a breathing exercise", route: "/nervous-system" },
    { emoji: "📖", label: "Read something helpful", route: "/learn" },
  ],
  exhausted: [
    { emoji: "🫁", label: "Gentle breathing", route: "/nervous-system" },
    { emoji: "🔋", label: "Plan your energy", route: "/energy-budget" },
    { emoji: "💬", label: "Chat with your coach", route: "/coach" },
  ],
};

interface DailyCheckInFlowProps {
  onComplete: (mood: CheckInMood) => void;
  onDismiss?: () => void;
  variant?: "modal" | "card";
}

const DailyCheckInFlow = ({ onComplete, onDismiss, variant = "card" }: DailyCheckInFlowProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"ask" | "response" | "suggest">("ask");
  const [selectedMood, setSelectedMood] = useState<CheckInMood | null>(null);
  const [aiResponse, setAiResponse] = useState("");

  const handleSelect = (mood: CheckInMood) => {
    setSelectedMood(mood);
    // onComplete saves data & returns the AI response text
    const result = onComplete(mood);
    // The hook returns CheckInData but we call it from parent
    setStep("response");
  };

  const isModal = variant === "modal";

  return (
    <div className={isModal ? "" : "rounded-2xl border border-primary/15 bg-primary/5 p-5"}>
      <AnimatePresence mode="wait">
        {step === "ask" && (
          <motion.div
            key="ask"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4 text-center"
          >
            <div className="space-y-1">
              <p className="text-lg font-semibold text-foreground">How are you feeling today?</p>
              <p className="text-xs text-muted-foreground">Take a moment. There's no wrong answer.</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {MOOD_OPTIONS.map(({ key, emoji, label }) => (
                <button
                  key={key}
                  onClick={() => handleSelect(key)}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:bg-primary/5 active:scale-95"
                >
                  <span className="text-3xl">{emoji}</span>
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </button>
              ))}
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip for now
              </button>
            )}
          </motion.div>
        )}

        {step === "response" && selectedMood && (
          <motion.div
            key="response"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4 text-center"
          >
            <span className="text-4xl">
              {MOOD_OPTIONS.find((m) => m.key === selectedMood)?.emoji}
            </span>
            <p className="text-sm text-foreground leading-relaxed max-w-xs mx-auto font-medium">
              {/* Read from localStorage since parent saved it */}
              {(() => {
                try {
                  const data = JSON.parse(localStorage.getItem("daily_checkin") || "{}");
                  return data.aiResponse || "";
                } catch { return ""; }
              })()}
            </p>
            <button
              onClick={() => setStep("suggest")}
              className="text-xs font-medium text-primary hover:underline"
            >
              Want help for today? →
            </button>
            {isModal && (
              <button
                onClick={onDismiss}
                className="block mx-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Continue to dashboard
              </button>
            )}
          </motion.div>
        )}

        {step === "suggest" && selectedMood && (
          <motion.div
            key="suggest"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            <p className="text-sm font-semibold text-foreground text-center">
              Here are some ideas for today:
            </p>
            <div className="space-y-2">
              {SUGGESTIONS[selectedMood].map(({ emoji, label, route }) => (
                <button
                  key={route}
                  onClick={() => {
                    onDismiss?.();
                    navigate(route);
                  }}
                  className="w-full flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-all hover:border-primary/30 hover:bg-primary/5 active:scale-[0.98]"
                >
                  <span className="text-xl">{emoji}</span>
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </button>
              ))}
            </div>
            {isModal && (
              <button
                onClick={onDismiss}
                className="block mx-auto text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
              >
                Close
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DailyCheckInFlow;
