import { trackEvent } from "../../events";

export async function trackRecoveryEvents(kind: "retry_succeeded" | "sync_flush_succeeded", metadata?: Record<string, unknown>) {
  await trackEvent(kind, metadata);
}
