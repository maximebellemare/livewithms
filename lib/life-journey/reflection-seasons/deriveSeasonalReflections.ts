import type { JourneySnapshot } from "../../journey-design/types";
import type { LifeJourneyNote } from "../types";

export function deriveSeasonalReflections(snapshot: JourneySnapshot | null): LifeJourneyNote | null {
  if (!snapshot?.seasonalSummary) {
    return null;
  }

  return {
    title: snapshot.seasonalSummary.title,
    body:
      snapshot.seasonalSummary.window === "yearly"
        ? "A longer stretch can still be read gently, without turning it into a story about transformation."
        : snapshot.seasonalSummary.body,
  };
}
