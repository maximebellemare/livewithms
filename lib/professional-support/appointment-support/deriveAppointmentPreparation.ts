export function deriveAppointmentPreparation(input: {
  fatigueAverage: number | null;
  stressAverage: number | null;
  sleepAverage: number | null;
}) {
  const lines: string[] = [];

  if (input.fatigueAverage !== null && input.fatigueAverage >= 4) {
    lines.push("Fatigue has felt heavier lately and may be worth discussing in practical terms.");
  }

  if (input.sleepAverage !== null && input.sleepAverage < 6.5) {
    lines.push("Sleep has been lighter recently, which may help explain lower capacity.");
  }

  if (input.stressAverage !== null && input.stressAverage >= 4) {
    lines.push("Stress has been more noticeable recently and may be affecting day-to-day pacing.");
  }

  return lines.slice(0, 3);
}
