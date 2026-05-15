export const ENERGY_AWARE_DEFAULTS = {
  longSessionSeconds: 24,
  shortSessionSeconds: 6,
  highSkippedCheckIns: 4,
  elevatedFatigue: 4,
  interactionFatigueThreshold: 5,
  rapidExitThreshold: 2,
  abandonedFlowThreshold: 2,
} as const;
