import { useState, useMemo, useRef } from "react";
import { PenLine, RefreshCw, CheckCircle2, X } from "lucide-react";
import VoiceMicButton from "@/components/journal/VoiceMicButton";
import { PROMPTS, getDailyPrompt } from "@/lib/dailyPrompts";
import { DailyEntry } from "@/hooks/useEntries";

/** Symptom-aware prompts that replace generic ones when data exists */
const SYMPTOM_PROMPTS: Record<string, { threshold: number; direction: "high" | "low"; prompts: string[] }> = {
  fatigue: {
    threshold: 6, direction: "high",
    prompts: [
      "Fatigue is heavy today — what's one thing you can let go of?",
      "When your energy is low, what brings you even a small spark of comfort?",
      "What would 'good enough' look like for today?",
    ],
  },
  pain: {
    threshold: 6, direction: "high",
    prompts: [
      "Pain can be isolating — is there someone who understands what you're going through?",
      "What does your body need most from you right now?",
      "Despite the pain, what's one thing you still managed today?",
    ],
  },
  mood: {
    threshold: 4, direction: "low",
    prompts: [
      "Your mood has been low — what usually helps you feel a little brighter?",
      "What's one kind thing you could do for yourself today?",
      "Is there something weighing on you that you'd like to put into words?",
    ],
  },
  brain_fog: {
    threshold: 6, direction: "high",
    prompts: [
      "Brain fog days are tough — what's one thing you did that took real effort?",
      "When thinking feels cloudy, what grounds you?",
      "What would you tell a friend having a foggy day like yours?",
    ],
  },
};

interface DailyPromptCardProps {
  onUsePrompt: (prompt: string) => void;
  entry?: DailyEntry | null;
}

const DailyPromptCard = ({ onUsePrompt, entry }: DailyPromptCardProps) => {
  const daily = getDailyPrompt();
  const [currentIndex, setCurrentIndex] = useState(daily.index);
  const [animating, setAnimating] = useState(false);
  const [useSymptom, setUseSymptom] = useState(true);

  // Find the first matching symptom-linked prompt
  const symptomPrompt = useMemo(() => {
    if (!entry) return null;
    for (const [key, config] of Object.entries(SYMPTOM_PROMPTS)) {
      const value = (entry as any)[key] as number | null;
      if (value === null) continue;
      const triggered = config.direction === "high" ? value >= config.threshold : value <= config.threshold;
      if (triggered) {
        const idx = Math.floor(Math.random() * config.prompts.length);
        return { key, prompt: config.prompts[idx], label: key.replace("_", " ") };
      }
    }
    return null;
  }, [entry]);

  const [showEditor, setShowEditor] = useState(false);
  const [reflectText, setReflectText] = useState("");
  const reflectRef = useRef<HTMLTextAreaElement>(null);

  const showSymptomPrompt = symptomPrompt && useSymptom;
  const currentPrompt = showSymptomPrompt ? symptomPrompt.prompt : PROMPTS[currentIndex];

  const shuffle = () => {
    if (showSymptomPrompt) {
      setUseSymptom(false);
      return;
    }
    setAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % PROMPTS.length);
      setAnimating(false);
    }, 180);
  };

  return (
    <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{showSymptomPrompt ? "🎯" : "💭"}</span>
          <span className="text-xs font-semibold text-foreground">
            {showSymptomPrompt ? `Prompt for your ${symptomPrompt.label}` : "Today's prompt"}
          </span>
        </div>
        <button
          onClick={shuffle}
          disabled={animating}
          className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          title="Try another prompt"
        >
          <RefreshCw className={`h-2.5 w-2.5 ${animating ? "animate-spin" : ""}`} />
          Another
        </button>
      </div>

      <p
        className={`text-sm font-medium text-foreground leading-relaxed transition-opacity duration-150 ${
          animating ? "opacity-0" : "opacity-100"
        }`}
      >
        {currentPrompt}
      </p>

      {!showEditor ? (
        <div className="flex items-center gap-2">
          <span className="relative inline-flex">
            <span className="absolute inset-0 rounded-lg bg-primary/20 pulse" />
            <button
              onClick={() => setShowEditor(true)}
              className="relative inline-flex items-center gap-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 px-3 py-1.5 text-xs font-semibold text-primary transition-all active:scale-95"
            >
              <PenLine className="h-3 w-3" />
              Reflect on this
            </button>
          </span>
          <VoiceMicButton onTranscript={(t) => {
            setReflectText((prev) => (prev ? prev + " " : "") + t);
            setShowEditor(true);
          }} />
        </div>
      ) : (
        <div className="space-y-2 animate-fade-in">
          <textarea
            ref={reflectRef}
            value={reflectText}
            onChange={(e) => setReflectText(e.target.value)}
            placeholder="Write your reflection…"
            maxLength={2000}
            rows={3}
            autoFocus
            className="w-full resize-none rounded-xl bg-secondary/60 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
          <div className="flex items-center gap-2 justify-between">
            <VoiceMicButton onTranscript={(t) => setReflectText((prev) => (prev ? prev + " " : "") + t)} />
            <button
              onClick={() => { setShowEditor(false); setReflectText(""); }}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
            >
              <X className="h-3 w-3" /> Cancel
            </button>
            <button
              onClick={() => {
                if (reflectText.trim()) {
                  onUsePrompt(reflectText.trim());
                  setReflectText("");
                  setShowEditor(false);
                }
              }}
              disabled={!reflectText.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-40"
            >
              <CheckCircle2 className="h-3 w-3" /> Add to journal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyPromptCard;
