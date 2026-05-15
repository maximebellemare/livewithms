export function deriveWatchInteractions(input: { lowEnergy: boolean }) {
  return input.lowEnergy
    ? "Wearable support can stay to quick taps and short grounding access."
    : "Wearables can offer quick support without turning into a constant feed.";
}
