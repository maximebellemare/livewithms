import type { AiModuleDefinition, AiModuleKey } from "./types";

export const AI_MODULES: Record<AiModuleKey, AiModuleDefinition> = {
  coach: {
    key: "coach",
    title: "AI Coach",
    maxContextItems: 6,
    maxSuggestedResponseParagraphs: 4,
  },
  insights: {
    key: "insights",
    title: "AI Insights",
    maxContextItems: 10,
    maxSuggestedResponseParagraphs: 4,
  },
  guidance: {
    key: "guidance",
    title: "Today guidance",
    maxContextItems: 5,
    maxSuggestedResponseParagraphs: 2,
  },
};
