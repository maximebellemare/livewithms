import type { ProfessionalConsent, ProfessionalRole } from "../types";

export function deriveProfessionalConsent(
  role: ProfessionalRole = "neurologist",
  overrides: Partial<ProfessionalConsent> = {},
): ProfessionalConsent {
  return {
    role,
    shareSummary: true,
    shareAppointments: true,
    shareMedicationSummary: true,
    shareQuestions: true,
    shareEmotionalContext: false,
    sharePersonalNotes: false,
    requiresManualExport: true,
    revocableAnytime: true,
    ...overrides,
  };
}
