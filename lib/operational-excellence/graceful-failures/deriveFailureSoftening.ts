import type { OperationalErrorCategory } from "../types";

export function deriveFailureSoftening(input: {
  category: OperationalErrorCategory;
  retryable?: boolean;
}) {
  const message =
    input.category === "offline"
      ? "Some parts can wait quietly until your connection is back."
      : input.category === "sync"
        ? "Things may need a little time to settle, but your progress should stay steady."
        : input.category === "storage"
          ? "What you entered may just need another quiet save."
          : input.category === "auth"
            ? "A short refresh may help this continue."
            : "This can stay simple while things recover.";

  return {
    tone: "calm",
    message,
    showRetry: input.retryable ?? true,
  } as const;
}
