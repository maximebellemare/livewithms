export function derivePacingExplanation(input: {
  fatigueAverage: number | null;
  sleepAverage: number | null;
}): string {
  if ((input.fatigueAverage !== null && input.fatigueAverage >= 4) || (input.sleepAverage !== null && input.sleepAverage < 6.5)) {
    return "Slower replies, shorter plans, or more rest may help protect energy right now.";
  }

  return "Gentler pacing can still matter even when the week looks relatively steady.";
}
