import { getProgramToolById } from "./catalog";
import type { ProgramTool } from "./types";

type MentalExhaustionInput = {
  fatigueTrend: "high" | "steady" | "lighter" | "unknown";
  stressTrend: "elevated" | "steady" | "lighter" | "unknown";
  brainFog: number | null;
  lowEnergyMode: boolean;
  lowEnergyAssistActive: boolean;
  recentToolIds: string[];
  lastOpenedToolId: string | null;
};

export type MentalExhaustionState = {
  title: string;
  body: string;
  surfacedToolIds: string[];
  recoveryLines: string[];
  continuityLine: string | null;
  simplifyFurther: boolean;
};

const BANNED_LANGUAGE =
  /(recover faster|mental performance|ai recovery optimization|maximize recovery|bounce back|productivity|push through|therapy)/gi;

function sanitizeCopy(text: string) {
  return text.replace(BANNED_LANGUAGE, "").replace(/\s{2,}/g, " ").trim();
}

function dedupeToolIds(toolIds: string[]) {
  return toolIds.filter((toolId, index) => toolIds.indexOf(toolId) === index).slice(0, 4);
}

function deriveContinuityLine(input: MentalExhaustionInput) {
  const lastTool = getProgramToolById(input.lastOpenedToolId);
  if (lastTool && (lastTool.category === "brain-fog" || lastTool.category === "low-energy")) {
    return `${lastTool.title} is still here if your brain needs less from the next part of the day.`;
  }

  const recentRecoveryTool = input.recentToolIds
    .map((toolId) => getProgramToolById(toolId))
    .find((tool) => tool?.category === "brain-fog" || tool?.category === "low-energy");

  if (recentRecoveryTool) {
    return "A lower-demand recovery tool is still here if mental rest needs to stay simple.";
  }

  return null;
}

function needsMoreRecoverySupport(input: MentalExhaustionInput) {
  return (
    input.lowEnergyMode ||
    input.lowEnergyAssistActive ||
    input.fatigueTrend === "high" ||
    input.stressTrend === "elevated" ||
    (typeof input.brainFog === "number" && input.brainFog >= 4)
  );
}

export function deriveMentalExhaustionSupport(input: MentalExhaustionInput): MentalExhaustionState {
  const toolIds: string[] = [];

  if (typeof input.brainFog === "number" && input.brainFog >= 4) {
    toolIds.push("empty-tank-support", "cognitive-decompression-reset", "mental-rest-permission");
  }

  if (input.lowEnergyMode || input.lowEnergyAssistActive || input.fatigueTrend === "high") {
    toolIds.push("slower-recovery-pacing", "mental-rest-permission", "decision-light-reset");
  }

  if (input.stressTrend === "elevated") {
    toolIds.push("nervous-system-downshift", "slower-recovery-pacing");
  }

  toolIds.push(
    "empty-tank-support",
    "mental-rest-permission",
    "cognitive-decompression-reset",
    "slower-recovery-pacing",
  );

  const surfacedToolIds = dedupeToolIds(toolIds).filter(
    (toolId): toolId is ProgramTool["id"] => Boolean(getProgramToolById(toolId)),
  );
  const continuityLine = deriveContinuityLine(input);
  const simplifyFurther = needsMoreRecoverySupport(input);

  if (simplifyFurther) {
    return {
      title: "Support for mentally depleted periods",
      body: sanitizeCopy(
        "This support includes calmer support for recovering after mentally exhausting periods, with lower-demand decompression and quieter pacing when everything feels depleted.",
      ),
      surfacedToolIds,
      recoveryLines: [
        "You may not need to mentally recover all at once.",
        "A quieter pace may help your system settle.",
        "Some periods naturally leave less mental energy available.",
      ],
      continuityLine,
      simplifyFurther,
    };
  }

  return {
    title: "Calmer recovery for mentally draining days",
    body: sanitizeCopy(
      "This support includes cognitive decompression, lower-pressure recovery support, and quieter routines for days that leave your mind feeling emptied out.",
    ),
    surfacedToolIds,
    recoveryLines: [
      "The next part of the day can ask less from you.",
      "Slower recovery can still be real recovery.",
      "Mental rest can stay practical and small.",
    ],
    continuityLine,
    simplifyFurther,
  };
}
