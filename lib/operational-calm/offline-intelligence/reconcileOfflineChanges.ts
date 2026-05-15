import type { DeferredAction } from "./queueDeferredActions";

export function reconcileOfflineChanges<TPayload>(
  pending: DeferredAction<TPayload>[],
  resolvedIds: string[],
) {
  const resolved = new Set(resolvedIds);
  return pending.filter((item) => !resolved.has(item.id));
}
