import type { JourneySnapshot } from "../../journey-design/types";
import type { LifeJourneyNote } from "../types";

export function deriveGroundingMemoryResurfacing(snapshot: JourneySnapshot | null): LifeJourneyNote | null {
  if (!snapshot?.memoryResurfacing?.shouldResurface || !snapshot.memoryResurfacing.body) {
    return null;
  }

  return {
    title: snapshot.memoryResurfacing.title ?? "A quieter note from earlier",
    body: "A steadier moment existed before. It can be remembered lightly, without needing to be recreated.",
  };
}
