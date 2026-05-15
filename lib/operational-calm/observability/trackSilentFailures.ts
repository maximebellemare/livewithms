import { trackDiagnosticEvent } from "../../events";

export async function trackSilentFailures(
  name:
    | "premium_status_refresh_failed"
    | "offline_sync_failed"
    | "ai_insight_request_failed"
    | "reminder_enable_failed"
    | "reminder_schedule_failed",
  metadata?: Record<string, unknown>,
) {
  await trackDiagnosticEvent(name, metadata);
}
