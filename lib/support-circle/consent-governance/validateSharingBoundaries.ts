import type { SupportCircleConsent } from "../types";

type SharingBoundaryInput = {
  consent: SupportCircleConsent;
  includesPersonalNotes: boolean;
  includesRealTimeData: boolean;
  lineCount: number;
};

export function validateSharingBoundaries(input: SharingBoundaryInput) {
  const blockedReasons: string[] = [];

  if (input.includesPersonalNotes && !input.consent.sharePersonalNotes) {
    blockedReasons.push("personal-notes-blocked");
  }

  if (input.includesRealTimeData && !input.consent.allowRealTimeUpdates) {
    blockedReasons.push("realtime-blocked");
  }

  if (input.lineCount > 8) {
    blockedReasons.push("too-dense");
  }

  return {
    valid: blockedReasons.length === 0,
    blockedReasons,
  };
}
