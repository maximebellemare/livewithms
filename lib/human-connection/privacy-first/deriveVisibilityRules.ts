import type { VisibilityRules } from "../types";

export function deriveVisibilityRules(): VisibilityRules {
  return {
    anonymousOnly: true,
    allowPersistentIdentity: false,
    showCounts: false,
    showReplies: false,
    showReactions: false,
  };
}

