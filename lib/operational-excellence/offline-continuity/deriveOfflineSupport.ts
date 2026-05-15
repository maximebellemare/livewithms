export function deriveOfflineSupport(input: {
  isOfflineLike: boolean;
  hasCachedContent: boolean;
}) {
  if (!input.isOfflineLike) {
    return "If the connection slows down, the app should stay steady and pick things up quietly.";
  }

  return input.hasCachedContent
    ? "You can keep using lighter parts of the app while offline, and fuller updates can wait quietly."
    : "You can still keep things simple while offline, and fuller updates can wait quietly.";
}
