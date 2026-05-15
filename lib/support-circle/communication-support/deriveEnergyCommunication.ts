export function deriveEnergyCommunication(input: {
  fatigueAverage: number | null;
  stressAverage: number | null;
}): string {
  if (input.fatigueAverage !== null && input.fatigueAverage >= 4) {
    return "Energy may be more limited than it looks from the outside right now.";
  }

  if (input.stressAverage !== null && input.stressAverage >= 4) {
    return "Capacity may change more quickly during higher-stress stretches.";
  }

  return "Energy can vary day to day, even when things look steady from the outside.";
}
