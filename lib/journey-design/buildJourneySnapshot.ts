import type { LongitudinalEntry } from "../longitudinal/types";
import { deriveContinuitySignals } from "./continuity-preservation/deriveContinuitySignals";
import { resurfaceGroundingPatterns } from "./continuity-preservation/resurfaceGroundingPatterns";
import { derivePersonhoodSafePatterns } from "./internal";
import { deriveRecoveryCycles } from "./long-term-rhythms/deriveRecoveryCycles";
import { deriveSeasonalRhythms } from "./long-term-rhythms/deriveSeasonalRhythms";
import { deriveMemoryResurfacing } from "./memory-curation/deriveMemoryResurfacing";
import { selectMeaningfulReflections } from "./memory-curation/selectMeaningfulReflections";
import { deriveLongWindowPatterns } from "./seasonal-reflections/deriveLongWindowPatterns";
import { deriveSeasonalSummary } from "./seasonal-reflections/deriveSeasonalSummary";
import type { JourneySnapshot } from "./types";

export function buildJourneySnapshot(entries: LongitudinalEntry[]): JourneySnapshot | null {
  if (entries.length === 0) {
    return null;
  }

  const selectedReflections = selectMeaningfulReflections(entries);
  return {
    seasonalSummary: deriveSeasonalSummary(entries),
    longWindowPatterns: derivePersonhoodSafePatterns(deriveLongWindowPatterns(entries)),
    continuitySignals: [...deriveContinuitySignals(entries), ...resurfaceGroundingPatterns(entries)],
    seasonalRhythms: deriveSeasonalRhythms(entries),
    recoveryCycles: deriveRecoveryCycles(entries),
    selectedReflections,
    memoryResurfacing: deriveMemoryResurfacing(selectedReflections),
    entries,
  };
}

