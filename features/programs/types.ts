export type ProgramSection = "Calm" | "Energy" | "Planning" | "Reflection";
export type ProgramTrack =
  | "nervous-system"
  | "sleep-support"
  | "stress-support"
  | "emotional-resilience"
  | "energy-management"
  | "mindfulness";

export type ProgramContentKind = "micro-guide" | "reflection-prompt" | "wellness-note";

export type ProgramContentItem = {
  id: string;
  kind: ProgramContentKind;
  title: string;
  body: string;
};

export type ProgramTool = {
  id: string;
  title: string;
  section: ProgramSection;
  whenToUse: string;
  durationLabel: string;
  durationSeconds?: number;
  description: string;
  steps: string[];
  completionMessage: string;
  futureTrack?: ProgramTrack;
  moduleId: string;
  premiumFeature?: "guided_programs";
  continuationLabel?: string;
  supportTags?: Array<"stress" | "sleep" | "fatigue" | "reflection" | "planning">;
};

export type ProgramModule = {
  id: string;
  title: string;
  section: ProgramSection;
  track: ProgramTrack;
  description: string;
  whyItHelps: string;
  estimatedPace: string;
  premiumFeature?: "guided_programs";
  toolIds: string[];
  content: ProgramContentItem[];
};

export type ProgramProgressEntry = {
  toolId: string;
  openedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  completionCount: number;
};

export type ProgramProgressSnapshot = {
  completedToolIds: string[];
  recentToolIds: string[];
  lastOpenedToolId: string | null;
  activeToolId: string | null;
  toolProgress: Record<string, ProgramProgressEntry>;
  updatedAt: string | null;
};
