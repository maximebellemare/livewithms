export type DistressSignalLevel = "low" | "guarded" | "elevated";

export type InterventionLimits = {
  maxInterpretiveSentences: number;
  preferGrounding: boolean;
  requireHumanSupportOrientation: boolean;
};
