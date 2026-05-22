export type AdaptiveProfile = {
  stressTrend: "elevated" | "steady" | "lighter" | "unknown";
  sleepTrend: "low" | "steady" | "rested" | "unknown";
  fatigueTrend: "high" | "steady" | "lighter" | "unknown";
  brainFogTrend: "high" | "steady" | "lighter" | "unknown";
  engagementPattern: "steady" | "gentle-reengagement" | "new" | "unknown";
  reflectionPattern: "active" | "quiet";
  reminderTone: "gentle-nudge" | "consistency-support" | "daily-checkin";
  homeMoment: string;
  lowEnergyMode: boolean;
  simplificationTitle: string;
  simplificationBody: string;
  suggestedProgram: "breathing-reset" | "body-scan" | "low-energy-checklist" | "one-priority-planner" | "hard-moment-reflection" | null;
  secondarySuggestedProgram: "breathing-reset" | "body-scan" | "low-energy-checklist" | "one-priority-planner" | "hard-moment-reflection" | null;
  preferredSupportStyle?: "calm" | "practical" | "reflective" | "steady";
  preferredProgramTags?: Array<"stress" | "sleep" | "fatigue" | "reflection" | "planning" | "overwhelm" | "brain-fog">;
};
