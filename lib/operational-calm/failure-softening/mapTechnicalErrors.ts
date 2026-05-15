type FailureKind =
  | "network"
  | "timeout"
  | "offline"
  | "ai"
  | "subscription"
  | "sync"
  | "storage"
  | "auth"
  | "unknown";

function getMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.toLowerCase();
  }

  if (typeof error === "string") {
    return error.toLowerCase();
  }

  if (error && typeof error === "object" && "message" in error) {
    const value = (error as { message?: unknown }).message;
    return typeof value === "string" ? value.toLowerCase() : "";
  }

  return "";
}

export function mapTechnicalErrors(error: unknown): FailureKind {
  const message = getMessage(error);

  if (message.includes("session") || message.includes("jwt") || message.includes("auth")) {
    return "auth";
  }

  if (message.includes("timeout") || message.includes("timed out")) {
    return "timeout";
  }

  if (message.includes("offline")) {
    return "offline";
  }

  if (message.includes("network request failed") || message.includes("failed to fetch") || message.includes("network")) {
    return "network";
  }

  if (message.includes("temporary_failure") || message.includes("temporarily unavailable") || message.includes("edge function")) {
    return "ai";
  }

  if (message.includes("purchase") || message.includes("pricing") || message.includes("revenue")) {
    return "subscription";
  }

  if (message.includes("sync")) {
    return "sync";
  }

  if (message.includes("storage")) {
    return "storage";
  }

  return "unknown";
}
