import { useState } from "react";
import { PenLine, RefreshCw } from "lucide-react";

/* A pool of gentle, open-ended reflection questions */
const PROMPTS = [
  "What helped you most today?",
  "What's one small thing you're grateful for right now?",
  "How did your body feel when you first woke up this morning?",
  "What did you do today to be kind to yourself?",
  "What's one moment from today you'd like to remember?",
  "What drained your energy most today, and what restored it?",
  "Did anything surprise you about how you felt today?",
  "What would make tomorrow feel a little easier?",
  "What are you holding on to that you could let go of today?",
  "Who or what gave you comfort today?",
  "What does your body need most right now?",
  "What's one thing you managed today despite how you were feeling?",
  "If you could tell your future self something about today, what would it be?",
  "What felt hard today — and how did you handle it?",
  "What are you proud of doing for yourself this week?",
  "Is there anything you've been avoiding thinking about?",
  "What small joy showed up unexpectedly today?",
  "How did you connect with others today, or did you need solitude?",
  "What does 'a good day' look like for you right now?",
  "What's one thing you want to do more of this week?",
];

/** Pick a consistent prompt for the day (changes daily, cycles through pool) */
function getDailyPrompt(): { prompt: string; index: number } {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
  );
  const index = dayOfYear % PROMPTS.length;
  return { prompt: PROMPTS[index], index };
}

interface DailyPromptCardProps {
  onUsePrompt: (prompt: string) => void;
}

const DailyPromptCard = ({ onUsePrompt }: DailyPromptCardProps) => {
  const daily = getDailyPrompt();
  const [currentIndex, setCurrentIndex] = useState(daily.index);
  const [animating, setAnimating] = useState(false);

  const currentPrompt = PROMPTS[currentIndex];

  const shuffle = () => {
    setAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % PROMPTS.length);
      setAnimating(false);
    }, 180);
  };

  return (
    <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 space-y-3 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-base">💭</span>
          <span className="text-xs font-semibold text-foreground">Today's prompt</span>
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

      {/* Prompt text */}
      <p
        className={`text-sm font-medium text-foreground leading-relaxed transition-opacity duration-150 ${
          animating ? "opacity-0" : "opacity-100"
        }`}
      >
        {currentPrompt}
      </p>

      {/* CTA */}
      <button
        onClick={() => onUsePrompt(currentPrompt)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 px-3 py-1.5 text-xs font-semibold text-primary transition-all active:scale-95"
      >
        <PenLine className="h-3 w-3" />
        Reflect on this
      </button>
    </div>
  );
};

export default DailyPromptCard;
