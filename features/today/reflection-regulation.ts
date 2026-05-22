export type ReflectionModeId =
  | "low-energy"
  | "grounding"
  | "difficult-day"
  | "uncertainty"
  | "anchoring";

export type ReflectionMode = {
  id: ReflectionModeId;
  label: string;
  helper: string;
  placeholder: string;
  groundingMoment: string;
  prompts: string[];
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
};

type ReflectionSupport = {
  defaultMode: ReflectionModeId;
  starterLimit: number;
  modes: ReflectionMode[];
};

const REFLECTION_MODES: Record<ReflectionModeId, ReflectionMode> = {
  "low-energy": {
    id: "low-energy",
    label: "Low energy",
    helper: "A few words are enough if that is all you have today.",
    placeholder: "A few words, if helpful.",
    groundingMoment: "Today can stay simple.",
    prompts: ["What feels most true right now?", "What can stay simple today?"],
  },
  grounding: {
    id: "grounding",
    label: "Grounding",
    helper: "Keep this close to the surface. You do not need to unpack everything.",
    placeholder: "One small thing that helped, or one thing to hold onto.",
    groundingMoment: "You do not need to solve everything right now.",
    prompts: ["What helped even a little?", "What feels steady enough for today?"],
  },
  "difficult-day": {
    id: "difficult-day",
    label: "Difficult day",
    helper: "Naming the day briefly can be enough.",
    placeholder: "A brief note about what felt heavy, if you want.",
    groundingMoment: "Some days are heavier than others.",
    prompts: ["What felt heaviest today?", "What might make the next few hours gentler?"],
  },
  uncertainty: {
    id: "uncertainty",
    label: "Uncertainty",
    helper: "A clear answer is not required.",
    placeholder: "Anything that feels uncertain, unsettled, or unfinished.",
    groundingMoment: "Not everything needs to become clear today.",
    prompts: ["What feels unclear right now?", "What do I not need to solve today?"],
  },
  anchoring: {
    id: "anchoring",
    label: "Anchoring",
    helper: "A small ordinary detail can be enough to keep from today.",
    placeholder: "One small thing to carry forward from today.",
    groundingMoment: "A small steady detail can still count.",
    prompts: ["What felt okay enough today?", "What do I want to carry forward?"],
  },
};

function limitModes(modeIds: ReflectionModeId[], maxModes: number) {
  return modeIds.slice(0, maxModes).map((modeId) => REFLECTION_MODES[modeId]);
}

export function deriveReflectionSupport(input: ReflectionSupportInput): ReflectionSupport {
  const heavyEnergy =
    input.lowEnergyMode || (input.fatigue ?? 0) >= 4 || (input.brainFog ?? 0) >= 4;
  const heavyEmotionalLoad = (input.stress ?? 0) >= 4 || (input.mood ?? 5) <= 1;
  const reduced = input.compressionMode === "reduced";
  const hasHeavierEntry = input.hasExistingNotes && (heavyEnergy || heavyEmotionalLoad);

  if (heavyEnergy) {
    return {
      defaultMode: "low-energy",
      starterLimit: Math.min(input.noteStarterLimit, hasHeavierEntry || reduced ? 1 : 2),
      modes: limitModes(["low-energy", "grounding", "anchoring"], reduced ? 2 : 3),
    };
  }

  if (heavyEmotionalLoad) {
    return {
      defaultMode: "grounding",
      starterLimit: Math.min(input.noteStarterLimit, hasHeavierEntry || reduced ? 1 : 2),
      modes: limitModes(["grounding", "difficult-day", "uncertainty"], reduced ? 2 : 3),
    };
  }

  return {
    defaultMode: reduced ? "anchoring" : "uncertainty",
    starterLimit: Math.min(input.noteStarterLimit, reduced ? 1 : 2),
    modes: limitModes(["anchoring", "uncertainty", "grounding"], reduced ? 2 : 3),
  };
}
