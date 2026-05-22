import type { LegacyIntegrityNote } from "../types";

export function derivePauseSupport(input: { lowEngagement?: boolean; wantsDistance?: boolean }): LegacyIntegrityNote {
  if (input.lowEngagement || input.wantsDistance) {
    return {
      title: "Pausing can be healthy",
      body: "Stepping back, tracking less, or needing less support does not take away dignity or continuity.",
    };
  }

  return {
    title: "This can stay flexible",
    body: "Use the app lightly, and leave space around it.",
  };
}
