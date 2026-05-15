import type { OperationalErrorCategory } from "../types";
import { deriveFailureSoftening } from "../graceful-failures/deriveFailureSoftening";

export function deriveEmotionallySafeErrors(input: {
  category: OperationalErrorCategory;
  retryable?: boolean;
}) {
  const softened = deriveFailureSoftening(input);
  const title =
    input.category === "offline"
      ? "Connection is taking a pause"
      : input.category === "auth"
        ? "This needs a short refresh"
        : "Something needs a moment";
  const retryLabel = softened.showRetry ? "Try again gently" : "Okay";

  return {
    title,
    message: softened.message,
    retryLabel,
  };
}
