import type { LegacyIntegrityNote } from "../types";

export function derivePauseSupport(input: { lowEngagement?: boolean; wantsDistance?: boolean }): LegacyIntegrityNote {
  if (input.lowEngagement || input.wantsDistance) {
    return {
      title: "Pausing can be healthy",
      body: "It can be okay to step back for a while, track less, or need less support without losing dignity or continuity.",
    };
  }

  return {
    title: "This can stay flexible",
    body: "Use the app when it helps, and leave space when it does not.",
  };
}
