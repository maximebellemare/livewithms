import type { SupportPermissionProfile } from "../types";

type SharedContextInput = {
  permissions: SupportPermissionProfile;
  fatigueAverage: number | null;
  stressAverage: number | null;
  sleepAverage: number | null;
  activeMedicationsCount: number;
  nextAppointmentLine: string | null;
  careQuestionCount: number;
};

export function deriveSafeSharedContext(input: SharedContextInput): string[] {
  const lines: string[] = [];

  if (input.permissions.canViewHighLevelSummary && input.fatigueAverage !== null) {
    lines.push(
      input.fatigueAverage >= 4
        ? "Fatigue appears heavier this week."
        : "Energy has looked a little steadier this week.",
    );
  }

  if (input.permissions.canViewEnergyContext && input.stressAverage !== null && input.stressAverage >= 4) {
    lines.push("Stress has been more noticeable recently.");
  }

  if (input.permissions.canViewPacingNeeds && input.sleepAverage !== null && input.sleepAverage < 6.5) {
    lines.push("Lower-energy periods may call for gentler pacing right now.");
  }

  if (input.permissions.canViewAppointments && input.nextAppointmentLine) {
    lines.push(`A next care visit is coming up: ${input.nextAppointmentLine}.`);
  }

  if (input.permissions.canViewMedicationSummary && input.activeMedicationsCount > 0) {
    lines.push(
      `${input.activeMedicationsCount} active ${
        input.activeMedicationsCount === 1 ? "medication is" : "medications are"
      } part of the current routine.`,
    );
  }

  if (input.permissions.canViewCareQuestions && input.careQuestionCount > 0) {
    lines.push("There may be a few practical care questions worth keeping in mind.");
  }

  return lines.slice(0, 4);
}
