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

    if (message.includes("invalid login credentials")) {
      return "Invalid email or password.";
    }

    if (message.includes("email not confirmed")) {
      return "Please confirm your email before signing in.";
    }

    if (message.includes("already registered") || message.includes("already been registered")) {
      return "An account with this email may already exist.";
    }

    if (message.includes("password")) {
      return "Password does not meet requirements.";
    }

    return error.message;
  }

  return "Something went wrong. Please try again.";
}
