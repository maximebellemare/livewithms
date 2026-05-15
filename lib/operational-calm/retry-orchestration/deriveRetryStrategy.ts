import { mapTechnicalErrors } from "../failure-softening/mapTechnicalErrors";
import { deriveBackoffWindow } from "./deriveBackoffWindow";

export function deriveRetryStrategy(error: unknown, attempt = 0) {
  const kind = mapTechnicalErrors(error);
  const retryable = ["network", "timeout", "offline", "ai", "subscription", "sync"].includes(kind);

  return {
    retryable,
    silent: retryable,
    dedupeKey: `${kind}:${attempt}`,
    delayMs: retryable ? deriveBackoffWindow(attempt) : 0,
    maxAttempts: kind === "subscription" ? 2 : kind === "ai" ? 2 : 3,
  };
}
