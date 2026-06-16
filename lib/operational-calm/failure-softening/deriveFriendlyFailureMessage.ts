import { classifyFailureSeverity } from "./classifyFailureSeverity";
import { mapTechnicalErrors } from "./mapTechnicalErrors";

export function deriveFriendlyFailureMessage(error: unknown) {
  const kind = mapTechnicalErrors(error);
  const severity = classifyFailureSeverity(error);

  if (kind === "auth") {
    return "Your session needs a quick refresh before this can continue.";
  }

  if (kind === "offline") {
    return "You seem to be offline right now. Some updates can wait and sync later.";
  }

  if (kind === "network" || kind === "timeout") {
    return severity === "minor"
      ? "Things seem a little slow right now. We’ll keep trying quietly."
      : "Some updates may take a moment. We’ll keep trying in the background.";
  }

  if (kind === "ai") {
    return "This feature is taking a quiet pause right now. Try again shortly.";
  }

  if (kind === "subscription") {
    return "Your Premium status is taking a moment to catch up. Your access should settle shortly.";
  }

  if (kind === "sync") {
    return "Some updates are still settling in. They should catch up shortly.";
  }

  if (kind === "storage") {
    return "Something was not fully saved just yet. We’ll keep this as steady as we can.";
  }

  return "Something did not load yet. Please try again.";
}
