export function deriveSilentSyncBehavior(input: {
  hasPendingSync: boolean;
  isOffline: boolean;
}) {
  if (input.isOffline) {
    return "Changes can wait quietly and sync later without creating pressure.";
  }

  if (input.hasPendingSync) {
    return "Sync can stay in the background without asking for attention.";
  }

  return "Continuity works best when sync stays mostly invisible.";
}
