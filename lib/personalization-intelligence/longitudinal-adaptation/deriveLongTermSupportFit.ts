export function deriveLongTermSupportFit(input: {
  preferredSupportStyle?: string | null;
  engagementRhythm?: string | null;
  lowEnergy: boolean;
}) {
  if (input.lowEnergy) {
    return "Over time, support may fit better when it stays lighter and easier to step away from.";
  }

  if (input.preferredSupportStyle === "practical" || input.engagementRhythm === "light") {
    return "Longer-term fit may come from simpler, lower-friction support rather than more depth.";
  }

  return "Support can gradually fit better without trying to define your whole pattern.";
}
