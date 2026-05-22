import { getProgramToolById } from "./catalog";
import type { ProgramTool } from "./types";

type SleepRecoveryInput = {
  timeOfDay: "morning" | "afternoon" | "evening";
  stressTrend: "elevated" | "steady" | "lighter" | "unknown";
  fatigueTrend: "high" | "steady" | "lighter" | "unknown";
  recentSleepAverage: number | null;
  lowEnergyMode: boolean;
  lowEnergyAssistActive: boolean;
};

export type SleepRecoveryState = {
  title: string;
  body: string;
  surfacedToolIds: string[];
  reflectionPrompts: string[];
  useCalmerNightVisuals: boolean;
};

const BANNED_SLEEP_LANGUAGE = /(optimize|biohack|perfect routine|sleep intelligence|recovery system|transform)/gi;

function sanitizeSleepCopy(text: string) {
  return text.replace(BANNED_SLEEP_LANGUAGE, "").replace(/\s{2,}/g, " ").trim();
}

function dedupeToolIds(toolIds: string[]) {
  return toolIds.filter((toolId, index) => toolIds.indexOf(toolId) === index).slice(0, 3);
}

export function deriveSleepRecoverySupport(input: SleepRecoveryInput): SleepRecoveryState {
  const toolIds: string[] = [];
  const reflectionPrompts = [
    "What pressure could stay unfinished tonight?",
    "What would make tonight feel gentler?",
    "What deserves less mental energy tonight?",
  ];

  if (input.timeOfDay === "evening") {
    toolIds.push("quiet-evening-reset", "sleep-decompression-flow", "mentally-overloaded-tonight");
  }

  if (input.stressTrend === "elevated") {
    toolIds.push("mentally-overloaded-tonight", "reduce-stimulation-guide");
  }

  if (input.lowEnergyMode || input.lowEnergyAssistActive || input.fatigueTrend === "high") {
    toolIds.push("low-energy-evening-wind-down", "bedtime-grounding-prompt");
  }

  if ((input.recentSleepAverage ?? 0) > 0 && (input.recentSleepAverage ?? 0) < 6.5) {
    toolIds.push("sleep-decompression-flow", "quiet-evening-reset");
  }

  const surfacedToolIds = dedupeToolIds(toolIds).filter((toolId): toolId is ProgramTool["id"] => Boolean(getProgramToolById(toolId)));

  if (input.timeOfDay === "evening" && (input.stressTrend === "elevated" || input.lowEnergyMode || input.lowEnergyAssistActive)) {
    return {
      title: "A quieter way to end a heavier day",
      body: sanitizeSleepCopy(
        "Premium includes calmer evening support, bedtime grounding, and lower-stimulation wind-down tools when the day has stayed loud for too long.",
      ),
      surfacedToolIds,
      reflectionPrompts,
      useCalmerNightVisuals: true,
    };
  }

  if ((input.recentSleepAverage ?? 0) > 0 && (input.recentSleepAverage ?? 0) < 6.5) {
    return {
      title: "Calmer support for nights that need less friction",
      body: sanitizeSleepCopy(
        "Premium includes short decompression flows, gentle evening support, and quiet audio to help the night feel less demanding.",
      ),
      surfacedToolIds,
      reflectionPrompts,
      useCalmerNightVisuals: input.timeOfDay === "evening",
    };
  }

  return {
    title: "Evening support that stays low-pressure",
    body: sanitizeSleepCopy(
      "Premium includes calmer evening support and nervous-system-friendly wind-down tools that stay brief, quiet, and easy to leave when needed.",
    ),
    surfacedToolIds,
    reflectionPrompts,
    useCalmerNightVisuals: input.timeOfDay === "evening",
  };
}
