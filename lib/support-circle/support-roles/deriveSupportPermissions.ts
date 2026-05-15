import type { SupportCircleConsent, SupportPermissionProfile, SupportRole } from "../types";

export function deriveSupportPermissions(
  role: SupportRole,
  consent?: SupportCircleConsent,
): SupportPermissionProfile {
  return {
    role,
    canViewHighLevelSummary: consent?.shareHighLevelSummary ?? false,
    canViewEnergyContext: consent?.shareEnergyContext ?? false,
    canViewPacingNeeds: consent?.sharePacingNeeds ?? false,
    canViewAppointments:
      (role === "partner" || role === "family-member" || role === "caregiver") &&
      (consent?.shareAppointments ?? false),
    canViewMedicationSummary:
      (role === "partner" || role === "family-member" || role === "caregiver") &&
      (consent?.shareMedicationSummary ?? false),
    canViewCareQuestions:
      (role === "partner" || role === "caregiver") && (consent?.shareCareQuestions ?? false),
    canViewPersonalNotes: consent?.sharePersonalNotes ?? false,
    canViewDerivedThemesOnly: consent?.shareDerivedThemesOnly ?? false,
    maxUpdateFrequency: consent?.allowRealTimeUpdates ? "occasional" : "manual-only",
  };
}
