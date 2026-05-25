import type { OperationalErrorCategory } from "../types";

export function deriveFailureSoftening(input: {
  category: OperationalErrorCategory;
  retryable?: boolean;
}) {
  const message =
    input.category === "offline"
      ? "Check your connection and try again."
      : input.category === "sync"
        ? "Sync did not finish. Try again."
        : input.category === "storage"
          ? "Your changes could not be saved. Try again."
          : input.category === "auth"
            ? "Refresh or sign in again."
            : "Please try again.";

  return {
    tone: "calm",
    message,
    showRetry: input.retryable ?? true,
  } as const;
}
