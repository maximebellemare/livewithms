import { getProgramToolById } from "./catalog";
import type { ProgramTool } from "./types";

type CommunicationSupportInput = {
  stressTrend: "elevated" | "steady" | "lighter" | "unknown";
  fatigueTrend: "high" | "steady" | "lighter" | "unknown";
  brainFog: number | null;
  lowEnergyMode: boolean;
  lowEnergyAssistActive: boolean;
  recentToolIds: string[];
  lastOpenedToolId: string | null;
};

export type CommunicationSupportState = {
  title: string;
  body: string;
  phrases: string[];
  surfacedToolIds: string[];
  continuityLine: string | null;
  simplifyFurther: boolean;
};

const BANNED_COMMUNICATION_LANGUAGE =
  /(relationship coaching|social optimization|advanced emotional intelligence|ai relationship support|assert dominance|manipulate|control the conversation)/gi;

function sanitizeCommunicationCopy(text: string) {
  return text.replace(BANNED_COMMUNICATION_LANGUAGE, "").replace(/\s{2,}/g, " ").trim();
}

function dedupeToolIds(toolIds: string[]) {
  return toolIds.filter((toolId, index) => toolIds.indexOf(toolId) === index).slice(0, 3);
}

function hasHeavySocialMoment(input: CommunicationSupportInput) {
  return (
    input.lowEnergyMode ||
    input.lowEnergyAssistActive ||
    input.fatigueTrend === "high" ||
    input.stressTrend === "elevated" ||
    (typeof input.brainFog === "number" && input.brainFog >= 4)
  );
}

function deriveContinuityLine(input: CommunicationSupportInput) {
  const lastTool = getProgramToolById(input.lastOpenedToolId);
  if (lastTool && lastTool.moduleId === "communication-support") {
    return `${lastTool.title} is still here if you want a simpler way to say what today feels like.`;
  }

  const recentTool = input.recentToolIds
    .map((toolId) => getProgramToolById(toolId))
    .find((tool) => tool?.moduleId === "communication-support");

  if (recentTool) {
    return "A calmer communication tool is still here if you do not want to overexplain.";
  }

  return null;
}

export function deriveCommunicationSupport(input: CommunicationSupportInput): CommunicationSupportState {
  const toolIds: string[] = [];

  if (input.stressTrend === "elevated") {
    toolIds.push("communicating-overwhelm-simply", "gentle-boundary-check");
  }

  if (input.lowEnergyMode || input.lowEnergyAssistActive || input.fatigueTrend === "high") {
    toolIds.push("short-ways-to-say-low-energy", "gentle-boundary-check");
  }

  if (typeof input.brainFog === "number" && input.brainFog >= 4) {
    toolIds.push("explaining-brain-fog-gently");
  }

  toolIds.push("short-ways-to-say-low-energy", "gentle-boundary-check", "communicating-overwhelm-simply");

  const surfacedToolIds = dedupeToolIds(toolIds).filter((toolId): toolId is ProgramTool["id"] => Boolean(getProgramToolById(toolId)));
  const simplifyFurther = hasHeavySocialMoment(input);
  const continuityLine = deriveContinuityLine(input);

  const phrases = simplifyFurther
    ? [
        "I may need a quieter pace today.",
        "My energy is a little lower right now.",
        "I may need to keep things simpler today.",
      ]
    : [
        "I may need a quieter pace today.",
        "I may need to keep this simple.",
        "I do not have much extra energy to explain more right now.",
      ];

  if (simplifyFurther) {
    return {
      title: "Calmer support for difficult human moments",
      body: sanitizeCommunicationCopy(
        "Premium includes calmer communication and relationship support during difficult periods, with lower-pressure ways to explain low energy, brain fog, or overwhelm.",
      ),
      phrases,
      surfacedToolIds,
      continuityLine,
      simplifyFurther,
    };
  }

  return {
    title: "Communication support that stays simple and humane",
    body: sanitizeCommunicationCopy(
      "Premium includes calmer communication support when you want a simpler way to explain a difficult day, protect energy, or reduce social pressure.",
    ),
    phrases,
    surfacedToolIds,
    continuityLine,
    simplifyFurther,
  };
}
