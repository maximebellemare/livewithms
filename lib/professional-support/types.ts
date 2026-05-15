export type ProfessionalRole =
  | "neurologist"
  | "therapist"
  | "physiotherapist"
  | "caregiver"
  | "support-professional";

export type ProfessionalConsent = {
  role: ProfessionalRole;
  shareSummary: boolean;
  shareAppointments: boolean;
  shareMedicationSummary: boolean;
  shareQuestions: boolean;
  shareEmotionalContext: boolean;
  sharePersonalNotes: boolean;
  requiresManualExport: boolean;
  revocableAnytime: boolean;
};
