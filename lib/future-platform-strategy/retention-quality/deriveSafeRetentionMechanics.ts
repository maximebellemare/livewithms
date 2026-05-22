import type { SafeRetentionMechanics } from "../types";

export function deriveSafeRetentionMechanics(): SafeRetentionMechanics {
  return {
    allowedDrivers: [
      "usefulness",
      "trust",
      "steadiness",
      "continuity",
      "reduced overwhelm",
      "lower friction",
    ],
    blockedDrivers: [
      "urgency",
      "streaks",
      "dopamine loops",
      "emotional dependency",
      "manipulative notifications",
      "fear-based upsells",
    ],
    lowPressureRequired: true,
    manipulativeUrgencyBlocked: true,
  };
}
