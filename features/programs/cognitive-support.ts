import { getProgramToolById } from "./catalog";
import type { ProgramTool } from "./types";

type CognitiveSupportInput = {
  brainFog: number | null;
  fatigueTrend: "high" | "steady" | "lighter" | "unknown";
  stressTrend: "elevated" | "steady" | "lighter" | "unknown";
  lowEnergyMode: boolean;
  lowEnergyAssistActive: boolean;
  recentToolIds: string[];
  lastOpenedToolId: string | null;
};

export type CognitiveSupportState = {
  title: string;
  body: string;
  surfacedToolIds: string[];
  continuityLine: string | null;
  simplifyFurther: boolean;
};

const BANNED_COGNITIVE_LANGUAGE =
  /(optimize your cognition|advanced brain performance|mental enhancement|peak focus|high-performance brain|n?ootropic)/gi;

function sanitizeCognitiveCopy(text: string) {
  return text.replace(BANNED_COGNITIVE_LANGUAGE, "").replace(/\s{2,}/g, " ").trim();
}

function dedupeToolIds(toolIds: string[]) {
  return toolIds.filter((toolId, index) => toolIds.indexOf(toolId) === index).slice(0, 3);
}

function hasHighBrainFog(input: CognitiveSupportInput) {
  return typeof input.brainFog === "number" && input.brainFog >= 4;
}

function deriveContinuityLine(input: CognitiveSupportInput) {
  const lastTool = getProgramToolById(input.lastOpenedToolId);
  if (lastTool && lastTool.category === "brain-fog") {
    return `${lastTool.title} is still here whenever you want to return.`;
  }

  const recentBrainFogTool = input.recentToolIds
    .map((toolId) => getProgramToolById(toolId))
    .find((tool) => tool?.category === "brain-fog");

  if (recentBrainFogTool) {
    return `A quieter support tool is still here if the next hour needs less decision-making.`;
  }

  return null;
}

export function deriveCognitiveSupport(input: CognitiveSupportInput): CognitiveSupportState {
  const toolIds: string[] = [];

  if (hasHighBrainFog(input)) {
    toolIds.push("too-many-thoughts-at-once", "one-thing-at-a-time", "brain-fog-clarifier");
  }

  if (input.lowEnergyMode || input.lowEnergyAssistActive || input.fatigueTrend === "high") {
    toolIds.push("simplify-the-next-hour", "decision-light-reset");
  }

  if (input.stressTrend === "elevated") {
    toolIds.push("reduce-mental-load", "cognitive-decompression-reset");
  }

  toolIds.push("brain-fog-clarifier", "decision-light-reset", "cognitive-decompression-reset");

  const surfacedToolIds = dedupeToolIds(toolIds).filter((toolId): toolId is ProgramTool["id"] => Boolean(getProgramToolById(toolId)));
  const continuityLine = deriveContinuityLine(input);
  const simplifyFurther =
    hasHighBrainFog(input) || input.lowEnergyMode || input.lowEnergyAssistActive || input.fatigueTrend === "high";

  if (hasHighBrainFog(input) || simplifyFurther) {
    return {
      title: "A calmer cognitive space for mentally heavy days",
      body: sanitizeCognitiveCopy(
        "Premium includes brain-fog-friendly tools that reduce decisions, shrink the next hour, and keep the mental load lighter when thinking already feels expensive.",
      ),
      surfacedToolIds,
      continuityLine,
      simplifyFurther,
    };
  }

  if (input.stressTrend === "elevated") {
    return {
      title: "Short support for mentally noisy moments",
      body: sanitizeCognitiveCopy(
        "Premium includes calmer cognitive support and mentally lighter tools when there are too many thoughts competing at once.",
      ),
      surfacedToolIds,
      continuityLine,
      simplifyFurther,
    };
  }

  return {
    title: "Brain-fog-friendly support that stays low-pressure",
    body: sanitizeCognitiveCopy(
      "Premium includes calmer cognitive support and brain-fog-friendly tools that stay brief, practical, and easy to leave when needed.",
    ),
    surfacedToolIds,
    continuityLine,
    simplifyFurther,
  };
}
