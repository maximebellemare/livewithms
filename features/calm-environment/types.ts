export type CalmDensityMode = "standard" | "spacious" | "simplified";

export type CalmEnvironmentState = {
  reducedMotion: boolean;
  softerHaptics: boolean;
  nightCalm: boolean;
  density: CalmDensityMode;
  updatedAt: string | null;
};
