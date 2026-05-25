export type CalmDensityMode = "standard" | "spacious" | "simplified";
export type AppearancePreference = "light" | "dark";

export type CalmEnvironmentState = {
  reducedMotion: boolean;
  softerHaptics: boolean;
  nightCalm: boolean;
  density: CalmDensityMode;
  appearance: AppearancePreference;
  updatedAt: string | null;
};
