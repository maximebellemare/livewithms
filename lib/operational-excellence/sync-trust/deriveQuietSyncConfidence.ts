export function deriveQuietSyncConfidence(input: {
  hasPendingSync: boolean;
  isOfflineLike: boolean;
}) {
  if (input.isOfflineLike && input.hasPendingSync) {
    return "Any unsent updates can wait quietly and catch up later.";
  }

  if (input.hasPendingSync) {
    return "Recent updates may still be settling in quietly.";
  }

  return "Things look settled right now.";
}
