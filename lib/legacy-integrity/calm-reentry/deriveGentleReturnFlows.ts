export function deriveGentleReturnFlows(input: { hasHistory: boolean }) {
  return input.hasHistory
    ? "If you return later, support can begin from where you are without guilt or pressure to catch up."
    : "If you return later, you can simply begin again.";
}
