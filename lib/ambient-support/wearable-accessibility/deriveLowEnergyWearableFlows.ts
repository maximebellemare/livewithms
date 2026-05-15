export function deriveLowEnergyWearableFlows(input: { lowEnergy: boolean; quieterDay: boolean }) {
  if (input.lowEnergy || input.quieterDay) {
    return "Low-energy wearable flows can stay short and easy to dismiss.";
  }

  return "Wearable flows can stay optional and brief.";
}
