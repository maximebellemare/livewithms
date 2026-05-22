export type CalmAudioCategory =
  | "grounding"
  | "low-energy"
  | "sleep"
  | "overwhelm"
  | "breathing"
  | "pacing"
  | "decompression";

export type CalmAudioPhase = {
  id: string;
  label: string;
  seconds: number;
  prompt: string;
  breathCue?: {
    inhaleSeconds?: number;
    exhaleSeconds?: number;
    pauseSeconds?: number;
  };
};

export type CalmAudioSession = {
  id: string;
  toolId: string;
  title: string;
  category: CalmAudioCategory;
  durationLabel: string;
  totalSeconds: number;
  description: string;
  whyItHelps: string;
  recommendation: string;
  lowStimulationNote: string;
  supportsBackgroundResumption: boolean;
  supportsHaptics: boolean;
  cachedOffline: boolean;
  premiumFeature: "calm_audio_support";
  phases: CalmAudioPhase[];
};

export type CalmAudioSessionProgress = {
  sessionId: string;
  toolId: string;
  phaseIndex: number;
  phaseSecondsRemaining: number;
  totalSecondsRemaining: number;
  isPlaying: boolean;
  hapticsEnabled: boolean;
  updatedAt: string;
};
