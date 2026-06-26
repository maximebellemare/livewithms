export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (
      message.includes("network request failed") ||
      message.includes("failed to fetch") ||
      message.includes("networkerror")
    ) {
      return "We couldn’t reach the server. Check your connection and try again.";
    }

    if (message.includes("timed out") || message.includes("timeout")) {
      return "The request took too long. Please try again.";
    }

    if (message.includes("invalid login credentials")) {
      return "Invalid email or password.";
    }

    if (message.includes("email not confirmed")) {
      return "Please confirm your email before signing in.";
    }

    if (message.includes("invalid email") || message.includes("email address is invalid")) {
      return "Please enter a valid email address.";
    }

    if (message.includes("already registered") || message.includes("already been registered")) {
      return "An account with this email may already exist.";
    }

    if (message.includes("rate limit") || message.includes("too many requests")) {
      return "Too many attempts right now. Please wait a moment and try again.";
    }

    if (
      message.includes("password should") ||
      message.includes("password must") ||
      message.includes("weak password")
    ) {
      return "Password does not meet requirements.";
    }

    if (message.includes("password")) {
      return "Password does not meet requirements.";
    }

    return error.message;
  }

  return "Something went wrong. Please try again.";
}
