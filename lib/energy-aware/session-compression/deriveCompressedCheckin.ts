import type { AdaptiveFlow, AdaptiveFlowInput } from "../types";

export function deriveCompressedCheckin(input: AdaptiveFlowInput): AdaptiveFlow["compressedCheckIn"] {
  const enabled =
    input.adaptiveState.primary === "LOW_ENERGY" ||
    input.adaptiveState.primary === "OVERWHELMED" ||
    input.skippedCheckIns >= 3;

  return {
    enabled,
    shortenSaveCopy: enabled,
    limitNoteStarters: enabled,
    keepOptionalSectionsCollapsed: true,
  };
}
