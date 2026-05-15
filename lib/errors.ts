import { deriveFriendlyFailureMessage } from "./operational-calm/failure-softening/deriveFriendlyFailureMessage";

type ErrorDetails = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

export type ErrorCategory = "network" | "ai" | "subscription" | "sync" | "storage" | "onboarding" | "auth" | "unknown";

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

export function isNetworkLikeError(error: unknown) {
  const message = getRawErrorMessage(error).toLowerCase();

  return (
    message.includes("network request failed") ||
    message.includes("failed to fetch") ||
    message.includes("offline") ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("network")
  );
}

export function categorizeError(error: unknown): ErrorCategory {
  const details = normalizeError(error);
  const message = details.message.toLowerCase();
  const code = details.code?.toLowerCase() ?? "";

  if (message.includes("sign in again") || message.includes("session")) {
    return "auth";
  }

  if (message.includes("network") || message.includes("try again in a moment")) {
    return "network";
  }

  if (message.includes("feature is taking a pause") || message.includes("busy right now")) {
    return "ai";
  }

  if (message.includes("purchase") || message.includes("pricing") || code.includes("revenue")) {
    return "subscription";
  }

  if (message.includes("onboarding")) {
    return "onboarding";
  }

  if (message.includes("sync")) {
    return "sync";
  }

  if (message.includes("storage")) {
    return "storage";
  }

  return "unknown";
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
    return deriveFriendlyFailureMessage(message);
  }

  return deriveFriendlyFailureMessage({ message, code });
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
