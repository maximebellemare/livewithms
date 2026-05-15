import type { ProfessionalConsent } from "../types";

export function validateSharingControls(input: {
  consent: ProfessionalConsent;
  includesPersonalNotes: boolean;
  includesEmotionalContext: boolean;
  lineCount: number;
}) {
  const blockedReasons: string[] = [];

  if (input.includesPersonalNotes && !input.consent.sharePersonalNotes) {
    blockedReasons.push("personal-notes-blocked");
  }

  if (input.includesEmotionalContext && !input.consent.shareEmotionalContext) {
    blockedReasons.push("emotional-context-blocked");
  }

  if (input.lineCount > 12) {
    blockedReasons.push("too-dense");
  }

  return {
    valid: blockedReasons.length === 0,
    blockedReasons,
  };
}
