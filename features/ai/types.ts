export type AiModuleKey = "coach" | "insights" | "guidance";

export type CoachMode = "reflect" | "calm" | "practical" | "encouragement";

export type AiModuleDefinition = {
  key: AiModuleKey;
  title: string;
  maxContextItems: number;
  maxSuggestedResponseParagraphs: number;
};
