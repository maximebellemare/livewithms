import type { SupportCircleConsent, SupportRole } from "../types";

export function deriveGranularConsent(
  role: SupportRole = "trusted-friend",
  overrides: Partial<SupportCircleConsent> = {},
): SupportCircleConsent {
  return {
    role,
    shareHighLevelSummary: false,
    shareEnergyContext: false,
    sharePacingNeeds: false,
    shareAppointments: false,
    shareMedicationSummary: false,
    shareCareQuestions: false,
    sharePersonalNotes: false,
    shareDerivedThemesOnly: true,
    allowRealTimeUpdates: false,
    requiresManualShare: true,
    revocableAnytime: true,
    ...overrides,
  };
}
