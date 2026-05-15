import { trackEvent } from "../../events";

export async function trackDegradedFlows(metadata?: Record<string, unknown>) {
  await trackEvent("retry_triggered", {
    degraded: true,
    ...(metadata ?? {}),
  });
}
