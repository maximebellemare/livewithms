type ErrorDetails = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

function getRawErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : "";
  }

  return "";
}

function getFriendlyMessage(message: string, code?: string) {
  const normalizedMessage = message.toLowerCase();
  const normalizedCode = code?.toLowerCase();

  if (
    normalizedCode === "pgrst301" ||
    normalizedMessage.includes("jwt") ||
    normalizedMessage.includes("session") ||
    normalizedMessage.includes("refresh token") ||
    normalizedMessage.includes("auth session missing")
  ) {
    return "Your session needs to be refreshed. Please sign in again.";
  }

  if (
    normalizedMessage.includes("network request failed") ||
    normalizedMessage.includes("failed to fetch") ||
    normalizedMessage.includes("network") ||
    normalizedMessage.includes("offline") ||
    normalizedMessage.includes("timed out") ||
    normalizedMessage.includes("timeout")
  ) {
    return "We could not reach the network just now. Please try again in a moment.";
  }

  if (
    normalizedMessage.includes("edge function") ||
    normalizedMessage.includes("temporary_failure") ||
    normalizedMessage.includes("temporarily unavailable")
  ) {
    return "That feature is taking a pause right now. Please try again soon.";
  }

  if (
    normalizedMessage.includes("quota") ||
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("too many requests")
  ) {
    return "That feature is a little busy right now. Please try again soon.";
  }

  if (!message || normalizedMessage === "unknown error") {
    return "Something did not go as planned. Please try again.";
  }

  return message;
}

export function normalizeError(error: unknown): ErrorDetails {
  if (error instanceof Error) {
    return {
      message: getFriendlyMessage(error.message),
    };
  }

  if (typeof error === "string") {
    return {
      message: getFriendlyMessage(error),
    };
  }

  if (error && typeof error === "object") {
    const maybeError = error as {
      message?: unknown;
      code?: unknown;
      details?: unknown;
      hint?: unknown;
    };

    const code = typeof maybeError.code === "string" ? maybeError.code : undefined;
    const rawMessage =
      typeof maybeError.message === "string" && maybeError.message.length > 0
        ? maybeError.message
        : "Unknown error";

    return {
      message: getFriendlyMessage(rawMessage, code),
      code,
      details: typeof maybeError.details === "string" ? maybeError.details : undefined,
      hint: typeof maybeError.hint === "string" ? maybeError.hint : undefined,
    };
  }

  return {
    message: getFriendlyMessage(getRawErrorMessage(error)),
  };
}

export function getErrorMessage(error: unknown) {
  return normalizeError(error).message;
}
