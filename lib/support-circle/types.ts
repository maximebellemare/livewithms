export type SupportRole = "partner" | "family-member" | "caregiver" | "trusted-friend";

export type SupportCircleConsent = {
  role: SupportRole;
  shareHighLevelSummary: boolean;
  shareEnergyContext: boolean;
  sharePacingNeeds: boolean;
  shareAppointments: boolean;
  shareMedicationSummary: boolean;
  shareCareQuestions: boolean;
  sharePersonalNotes: boolean;
  shareDerivedThemesOnly: boolean;
  allowRealTimeUpdates: boolean;
  requiresManualShare: boolean;
  revocableAnytime: boolean;
};

export type SupportPermissionProfile = {
  role: SupportRole;
  canViewHighLevelSummary: boolean;
  canViewEnergyContext: boolean;
  canViewPacingNeeds: boolean;
  canViewAppointments: boolean;
  canViewMedicationSummary: boolean;
  canViewCareQuestions: boolean;
  canViewPersonalNotes: boolean;
  canViewDerivedThemesOnly: boolean;
  maxUpdateFrequency: "manual-only" | "occasional";
};

export type SupportRoleBoundary = {
  role: SupportRole;
  avoidRealTimeVisibility: boolean;
  avoidEmotionalDetail: boolean;
  preserveAutonomyLanguage: boolean;
  summary: string;
};
