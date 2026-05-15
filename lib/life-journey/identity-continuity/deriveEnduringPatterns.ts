import type { JourneySnapshot } from "../../journey-design/types";

export function deriveEnduringPatterns(snapshot: JourneySnapshot | null) {
  if (!snapshot) {
    return null;
  }

  if (snapshot.continuitySignals.some((signal) => signal.kind === "grounding")) {
    return "Some grounding habits seem to keep returning, even when the weeks themselves do not look the same.";
  }

  if (snapshot.continuitySignals.some((signal) => signal.kind === "pacing")) {
    return "Pacing appears to remain one of the steadier threads across changing stretches.";
  }

  return snapshot.longWindowPatterns[0]?.body ?? null;
}
