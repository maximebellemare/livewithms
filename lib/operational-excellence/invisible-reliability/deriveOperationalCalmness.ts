export function deriveOperationalCalmness(input: {
  hasFailure: boolean;
  isOfflineLike: boolean;
  hasPendingSync: boolean;
}) {
  if (input.hasFailure || input.isOfflineLike || input.hasPendingSync) {
    return "Reliability can stay quiet, forgiving, and emotionally steady while things settle.";
  }

  return "Reliability should feel quiet enough to disappear into ordinary use.";
}
