import type { FinalizationSignal } from "../types";

export function preserveLongTermIdentity(input: {
  hasCalmTone: boolean;
  hasStablePhilosophy: boolean;
  avoidsTrendPressure: boolean;
}): FinalizationSignal {
  const stable = input.hasCalmTone && input.hasStablePhilosophy && input.avoidsTrendPressure;

  return {
    stable,
    summary: stable
      ? "Long-term identity remains calm, recognizable, and emotionally stable."
      : "Long-term identity is at risk and should be re-anchored to calmer, more stable patterns.",
  };
}
