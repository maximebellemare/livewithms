export function deriveLowMobilitySupport(input: { lowEffort: boolean }) {
  return input.lowEffort
    ? "Lower-mobility support can mean fewer gestures and less effort to move through a screen."
    : "Interaction can stay manageable without asking for extra effort.";
}
