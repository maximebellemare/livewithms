import type { CommunityDensity } from "../types";

export function deriveCalmInteractionPacing(density: CommunityDensity) {
  if (density === "minimal") {
    return {
      maxVisibleNotes: 1,
      replyTempo: "slow",
      allowRapidThreading: false,
    } as const;
  }

  if (density === "light") {
    return {
      maxVisibleNotes: 1,
      replyTempo: "gentle",
      allowRapidThreading: false,
    } as const;
  }

  return {
    maxVisibleNotes: 2,
    replyTempo: "steady",
    allowRapidThreading: false,
  } as const;
}
