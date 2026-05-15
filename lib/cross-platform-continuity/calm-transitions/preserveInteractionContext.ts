export function preserveInteractionContext(input: {
  hasDraft: boolean;
  hasRecentPrompt: boolean;
}) {
  if (input.hasDraft) {
    return "You can pick things up later without needing to start over.";
  }

  if (input.hasRecentPrompt) {
    return "A recent prompt does not need to follow you across every surface.";
  }

  return "Continuity can stay light rather than following you too aggressively.";
}
