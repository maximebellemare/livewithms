export const REFLECTION_SURFACE_DEFAULTS = {
  maxCards: 2,
  lowEnergyMaxCards: 1,
  shortBodyLimit: 140,
  mediumBodyLimit: 200,
  recentWindowDays: 7,
  consistencyWindowDays: 14,
  returningGapDays: 4,
  denseInteractionThreshold: 4,
} as const;

export const REFLECTION_INTENSE_KINDS = new Set(["emotional-awareness", "resilience-reflection"]);

export const SELF_KINDNESS_MARKERS = ["gentle", "kind", "enough", "rest", "slower", "softer"] as const;

export const SELF_CRITICISM_MARKERS = ["should", "failed", "behind", "lazy", "not enough", "guilty"] as const;

export const EMOTIONAL_HONESTY_MARKERS = ["hard", "overwhelmed", "tired", "foggy", "sad", "drained"] as const;
