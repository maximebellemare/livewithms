import type { OperationalErrorCategory } from "../types";
import { deriveFailureSoftening } from "../graceful-failures/deriveFailureSoftening";

export function deriveEmotionallySafeErrors(input: {
  category: OperationalErrorCategory;
  retryable?: boolean;
}) {
  const softened = deriveFailureSoftening(input);
  const title =
    input.category === "offline"
      ? "Connection problem"
      : input.category === "auth"
        ? "Sign-in problem"
        : "Something went wrong";
  const retryLabel = softened.showRetry ? "Try again" : "Okay";

  return {
    title,
    message: softened.message,
    retryLabel,
  };
}
