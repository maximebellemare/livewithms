import { getProgramToolById } from "./catalog";
import type { ProgramTool } from "./types";

type EmotionalResetInput = {
  fatigueTrend: "high" | "steady" | "lighter" | "unknown";
  stressTrend: "elevated" | "steady" | "lighter" | "unknown";
  brainFog: number | null;
  lowEnergyMode: boolean;
  lowEnergyAssistActive: boolean;
  recentToolIds: string[];
  lastOpenedToolId: string | null;
};

export type EmotionalResetState = {
  title: string;
  body: string;
  surfacedToolIds: string[];
  resetLines: string[];
  continuityLine: string | null;
  simplifyFurther: boolean;
};

const BANNED_LANGUAGE =
  /(emotional healing system|advanced nervous-system optimization|ai emotional regulation|deep healing|spiritual|therapy|always here for you)/gi;

function sanitizeCopy(text: string) {
  return text.replace(BANNED_LANGUAGE, "").replace(/\s{2,}/g, " ").trim();
}

function dedupeToolIds(toolIds: string[]) {
  return toolIds.filter((toolId, index) => toolIds.indexOf(toolId) === index).slice(0, 4);
}

function deriveContinuityLine(input: EmotionalResetInput) {
  const lastTool = getProgramToolById(input.lastOpenedToolId);
  if (lastTool && (lastTool.category === "overwhelm" || lastTool.category === "grounding")) {
    return `${lastTool.title} is still here if the next part of the day needs to stay quieter.`;
  }

  const recentResetTool = input.recentToolIds
    .map((toolId) => getProgramToolById(toolId))
    .find((tool) => tool?.category === "overwhelm" || tool?.category === "grounding");

  if (recentResetTool) {
    return "A quieter reset is still here if you do not want to carry this straight into the next hour.";
  }

  return null;
}

function needsMoreResetSupport(input: EmotionalResetInput) {
  return (
    input.lowEnergyMode ||
    input.lowEnergyAssistActive ||
    input.stressTrend === "elevated" ||
    input.fatigueTrend === "high" ||
    (typeof input.brainFog === "number" && input.brainFog >= 4)
  );
}

export function deriveEmotionalReset(input: EmotionalResetInput): EmotionalResetState {
  const toolIds: string[] = [];

  if (input.stressTrend === "elevated") {
    toolIds.push(
      "sixty-second-quiet-reset",
      "slow-things-down-reset",
      "reduce-emotional-carryover",
    );
  }

  if (typeof input.brainFog === "number" && input.brainFog >= 4) {
    toolIds.push("nervous-system-downshift", "reduce-stimulation-guide");
  }

  if (input.lowEnergyMode || input.lowEnergyAssistActive || input.fatigueTrend === "high") {
    toolIds.push("nervous-system-downshift", "calming-sensory-reset", "slow-things-down-reset");
  }

  toolIds.push(
    "sixty-second-quiet-reset",
    "nervous-system-downshift",
    "reduce-emotional-carryover",
    "reduce-stimulation-guide",
  );

  const surfacedToolIds = dedupeToolIds(toolIds).filter(
    (toolId): toolId is ProgramTool["id"] => Boolean(getProgramToolById(toolId)),
  );
  const continuityLine = deriveContinuityLine(input);
  const simplifyFurther = needsMoreResetSupport(input);

  if (simplifyFurther) {
    return {
      title: "Reset support for overloaded moments",
      body: sanitizeCopy(
        "Premium includes calmer emotional reset and nervous-system recovery support during overwhelming periods, with quieter steps that help the next part of the day feel less sharp.",
      ),
      surfacedToolIds,
      resetLines: [
        "You may not need to carry all of this into the next hour.",
        "A quieter pace may help your nervous system settle.",
        "It is okay if your system needs time to slow down.",
      ],
      continuityLine,
      simplifyFurther,
    };
  }

  return {
    title: "Calmer reset rituals for difficult moments",
    body: sanitizeCopy(
      "Premium includes short decompression, lower-stimulation support, and gentler transition tools for moments that leave emotional carryover behind.",
    ),
    surfacedToolIds,
    resetLines: [
      "The next part of the day can stay smaller.",
      "A short reset may help more than pushing through the carryover.",
      "You can let the system slow down a little before asking more from it.",
    ],
    continuityLine,
    simplifyFurther,
  };
}
