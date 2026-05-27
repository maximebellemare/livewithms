export type ReflectionThemeId =
  | "energy"
  | "pacing"
  | "stress"
  | "recovery"
  | "symptoms"
  | "what-helped"
  | "tomorrow";

export type ReflectionPrompt = {
  id: string;
  theme: ReflectionThemeId;
  question: string;
  placeholder: string;
};

type ReflectionSupportInput = {
  fatigue: number | null;
  stress: number | null;
  brainFog: number | null;
  mood: number | null;
  lowEnergyMode: boolean;
  compressionMode: "standard" | "reduced";
  hasExistingNotes: boolean;
  noteStarterLimit: number;
  date?: Date;
};

type ReflectionSupport = {
  prompt: ReflectionPrompt;
  helper: string;
};

const REFLECTION_PROMPTS: ReflectionPrompt[] = [
  {
    id: "what-helped-easier",
    theme: "what-helped",
    question: "What helped today feel easier?",
    placeholder: "A small adjustment, support, or moment that helped.",
  },
  {
    id: "energy-drain",
    theme: "energy",
    question: "What took the most energy today?",
    placeholder: "One thing that used more energy than expected.",
  },
  {
    id: "tomorrow-easier",
    theme: "tomorrow",
    question: "What would make tomorrow slightly easier?",
    placeholder: "One change, simplification, or preparation for tomorrow.",
  },
  {
    id: "repeat-tomorrow",
    theme: "pacing",
    question: "What would you like to repeat tomorrow?",
    placeholder: "Something that worked well enough to try again.",
  },
  {
    id: "actually-mattered",
    theme: "what-helped",
    question: "What actually mattered today?",
    placeholder: "One useful detail, priority, or moment worth remembering.",
  },
  {
    id: "symptom-impact",
    theme: "symptoms",
    question: "Which symptom affected the day most?",
    placeholder: "A symptom change or pattern you may want to remember.",
  },
  {
    id: "recovery-helped",
    theme: "recovery",
    question: "What helped recovery even a little?",
    placeholder: "Rest, lower stimulation, pacing, food, water, or support.",
  },
  {
    id: "stress-load",
    theme: "stress",
    question: "What added the most stress today?",
    placeholder: "One pressure point that shaped the day.",
  },
  {
    id: "smaller-tomorrow",
    theme: "tomorrow",
    question: "What could stay smaller tomorrow?",
    placeholder: "One expectation, task, or decision that can be simplified.",
  },
  {
    id: "pacing-worked",
    theme: "pacing",
    question: "Where did pacing help today?",
    placeholder: "A place where slowing, splitting, or reducing helped.",
  },
  {
    id: "brain-fog-support",
    theme: "energy",
    question: "What made thinking easier today?",
    placeholder: "A tool, environment, or simplification that reduced mental load.",
  },
  {
    id: "worth-noticing",
    theme: "symptoms",
    question: "What feels worth noticing from today?",
    placeholder: "A change, trigger, support, or useful pattern.",
  },
];

function getDayIndex(date = new Date()) {
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 1);
  const startOfDay = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((startOfDay - startOfYear) / 86_400_000);
}

function selectPrompt(themes: ReflectionThemeId[], date?: Date) {
  const pool = REFLECTION_PROMPTS.filter((prompt) => themes.includes(prompt.theme));
  const candidates = pool.length > 0 ? pool : REFLECTION_PROMPTS;
  return candidates[getDayIndex(date) % candidates.length] ?? REFLECTION_PROMPTS[0];
}

export function deriveReflectionSupport(input: ReflectionSupportInput): ReflectionSupport {
  const heavyEnergy =
    input.lowEnergyMode || (input.fatigue ?? 0) >= 4 || (input.brainFog ?? 0) >= 4;
  const heavyEmotionalLoad = (input.stress ?? 0) >= 4 || (input.mood ?? 5) <= 1;
  const reduced = input.compressionMode === "reduced";

  if (heavyEnergy) {
    return {
      prompt: selectPrompt(["energy", "pacing", "recovery", "symptoms"], input.date),
      helper: reduced
        ? "Optional. A few words are enough."
        : "Use one practical note to remember what affected your energy.",
    };
  }

  if (heavyEmotionalLoad) {
    return {
      prompt: selectPrompt(["stress", "what-helped", "tomorrow", "recovery"], input.date),
      helper: reduced
        ? "Optional. Keep it short."
        : "Use one practical note to reduce what you have to carry forward.",
    };
  }

  return {
    prompt: selectPrompt(["what-helped", "tomorrow", "pacing", "symptoms"], input.date),
    helper: input.hasExistingNotes
      ? "Update this only if something useful changed."
      : "Optional. Capture one useful detail from today.",
  };
}
