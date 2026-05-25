export type ProgramSection = "Calm" | "Energy" | "Planning" | "Reflection" | "Rest";
export type ProgramTrack =
  | "nervous-system"
  | "sleep-support"
  | "stress-support"
  | "emotional-resilience"
  | "energy-management"
  | "mindfulness"
  | "cognitive-support";

export type ProgramLibraryCategory =
  | "grounding"
  | "overwhelm"
  | "low-energy"
  | "sleep"
  | "pacing"
  | "brain-fog"
  | "emotional-regulation"
  | "care-prep";

export type ProgramContentKind = "micro-guide" | "reflection-prompt" | "wellness-note" | "audio-cue";

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
  category?: ProgramLibraryCategory;
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
  supportTags?: Array<"stress" | "sleep" | "fatigue" | "reflection" | "planning" | "overwhelm" | "brain-fog">;
};

export type ProgramModule = {
  id: string;
  title: string;
  section: ProgramSection;
  category?: ProgramLibraryCategory;
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

export type ProgramAudioSessionProgress = {
  sessionId: string;
  toolId: string;
  phaseIndex: number;
  phaseSecondsRemaining: number;
  totalSecondsRemaining: number;
  isPlaying: boolean;
  hapticsEnabled: boolean;
  updatedAt: string;
};

export type ProgramProgressSnapshot = {
  completedToolIds: string[];
  recentToolIds: string[];
  lastOpenedToolId: string | null;
  activeToolId: string | null;
  audioSession: ProgramAudioSessionProgress | null;
  toolProgress: Record<string, ProgramProgressEntry>;
  updatedAt: string | null;
};
