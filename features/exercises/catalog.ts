export type ExerciseCategory = "Attention" | "Memory" | "Dexterity" | "Reaction" | "Focus";

export type ExerciseId =
  | "memory-match"
  | "steady-tap"
  | "sequence-recall"
  | "reaction-check"
  | "pattern-spotting"
  | "focus-sprint";

export type ExerciseDefinition = {
  id: ExerciseId;
  title: string;
  category: ExerciseCategory;
  durationLabel: string;
  description: string;
  purpose: string;
  premiumOnly?: boolean;
};

export const EXERCISES: ExerciseDefinition[] = [
  {
    id: "memory-match",
    title: "Memory match",
    category: "Memory",
    durationLabel: "1-2 min",
    description: "Find calm matching pairs.",
    purpose: "Supports short-term memory and concentration.",
  },
  {
    id: "steady-tap",
    title: "Steady tap",
    category: "Dexterity",
    durationLabel: "30 sec",
    description: "Tap large targets at a steady pace.",
    purpose: "Supports dexterity and steady coordination.",
  },
  {
    id: "sequence-recall",
    title: "Sequence recall",
    category: "Attention",
    durationLabel: "1 min",
    description: "Watch a short sequence, then repeat it.",
    purpose: "Supports attention and working memory.",
    premiumOnly: true,
  },
  {
    id: "reaction-check",
    title: "Reaction check",
    category: "Reaction",
    durationLabel: "30 sec",
    description: "Wait for the cue, then tap once.",
    purpose: "Supports reaction timing and focus.",
    premiumOnly: true,
  },
  {
    id: "pattern-spotting",
    title: "Pattern spotting",
    category: "Focus",
    durationLabel: "1 min",
    description: "Find the one item that looks different.",
    purpose: "Supports visual attention and pattern recognition.",
    premiumOnly: true,
  },
  {
    id: "focus-sprint",
    title: "Focus sprint",
    category: "Focus",
    durationLabel: "1-2 min",
    description: "Tap matching targets as they appear.",
    purpose: "Supports sustained attention and focus consistency.",
    premiumOnly: true,
  },
];

export function getExerciseById(id: string | null | undefined) {
  return EXERCISES.find((exercise) => exercise.id === id) ?? null;
}
