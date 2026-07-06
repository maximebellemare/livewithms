import { getProgramToolById } from "./catalog";
import type { ProgramTool } from "./types";

type DifficultDaySupportInput = {
  fatigueTrend: "high" | "steady" | "lighter" | "unknown";
  stressTrend: "elevated" | "steady" | "lighter" | "unknown";
  brainFog: number | null;
  lowEnergyMode: boolean;
  lowEnergyAssistActive: boolean;
  recentToolIds: string[];
  lastOpenedToolId: string | null;
};

export type DifficultDaySupportState = {
  title: string;
  body: string;
  surfacedToolIds: string[];
  groundingLines: string[];
  continuityLine: string | null;
  simplifyFurther: boolean;
};

const BANNED_LANGUAGE =
  /(stay strong|keep fighting|push through|toxic positivity|advanced emotional resilience|mental health optimization|ai emotional support system)/gi;

function sanitizeCopy(text: string) {
  return text.replace(BANNED_LANGUAGE, "").replace(/\s{2,}/g, " ").trim();
}

function dedupeToolIds(toolIds: string[]) {
  return toolIds.filter((toolId, index) => toolIds.indexOf(toolId) === index).slice(0, 3);
}

function isDifficultDay(input: DifficultDaySupportInput) {
  return (
    input.lowEnergyMode ||
    input.lowEnergyAssistActive ||
    input.fatigueTrend === "high" ||
    input.stressTrend === "elevated" ||
    (typeof input.brainFog === "number" && input.brainFog >= 4)
  );
}

function deriveContinuityLine(input: DifficultDaySupportInput) {
  const lastTool = getProgramToolById(input.lastOpenedToolId);
  if (lastTool && lastTool.category === "overwhelm") {
    return `${lastTool.title} is still here if today needs less pressure.`;
  }

  const recentSupportTool = input.recentToolIds
    .map((toolId) => getProgramToolById(toolId))
    .find((tool) => tool?.category === "overwhelm" || tool?.category === "low-energy");

  if (recentSupportTool) {
    return "A quieter support tool is still here if the day needs to stay smaller.";
  }

  return null;
}

export function deriveDifficultDaySupport(input: DifficultDaySupportInput): DifficultDaySupportState {
  const toolIds: string[] = [];

  if (input.stressTrend === "elevated") {
    toolIds.push("everything-feels-too-hard", "less-pressure-reset", "sixty-second-quiet-reset");
  }

  if (input.lowEnergyMode || input.lowEnergyAssistActive || input.fatigueTrend === "high") {
    toolIds.push("i-cant-do-much-today", "less-pressure-reset", "low-energy-checklist");
  }

  if (typeof input.brainFog === "number" && input.brainFog >= 4) {
    toolIds.push("my-brain-feels-overloaded", "one-thing-at-a-time");
  }

  toolIds.push("everything-feels-too-hard", "less-pressure-reset", "i-need-things-quieter");

  const surfacedToolIds = dedupeToolIds(toolIds).filter((toolId): toolId is ProgramTool["id"] => Boolean(getProgramToolById(toolId)));
  const continuityLine = deriveContinuityLine(input);
  const simplifyFurther = isDifficultDay(input);

  if (simplifyFurther) {
    return {
      title: "Support for days when functioning feels harder",
      body: sanitizeCopy(
        "This support includes quieter grounding, lower-demand support, and smaller survival-mode tools for days when everything feels like too much.",
      ),
      surfacedToolIds,
      groundingLines: [
        "One small thing may be enough today.",
        "Reducing expectations may help right now.",
        "You do not need to solve everything today.",
      ],
      continuityLine,
      simplifyFurther,
    };
  }

  return {
    title: "Calmer support for heavier days",
    body: sanitizeCopy(
      "This support includes calmer support for heavier and lower-energy days, with practical tools that stay brief and easy to leave when needed.",
    ),
    surfacedToolIds,
    groundingLines: [
      "Today may be more about reducing pressure.",
      "A quieter pace may help right now.",
      "You can keep the day smaller if needed.",
    ],
    continuityLine,
    simplifyFurther,
  };
}
