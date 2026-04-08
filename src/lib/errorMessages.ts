/**
 * Maps raw technical error messages to user-friendly ones.
 * Used across the app to prevent raw error strings from reaching users.
 */

const ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "Incorrect email or password. Please try again.",
  "Email not confirmed": "Please check your email to verify your account before signing in.",
  "User already registered": "An account with this email already exists. Try signing in instead.",
  "Password should be at least 6 characters": "Password must be at least 6 characters.",
  "Email rate limit exceeded": "Too many attempts. Please wait a moment and try again.",
  "For security purposes, you can only request this after": "Please wait a moment before trying again.",
  "Unable to validate email address": "Please enter a valid email address.",
  "Signup requires a valid password": "Please enter a valid password.",
  "edge function returned a non-2xx status code": "Something went wrong. Please try again in a moment.",
  "Failed to fetch": "Connection issue. Please check your internet and try again.",
  "FunctionsHttpError": "Something went wrong. Please try again in a moment.",
  "FunctionsRelayError": "Connection issue. Please try again in a moment.",
};

export function friendlyError(raw: string | undefined | null): string {
  if (!raw) return "Something went wrong. Please try again.";
  
  for (const [key, friendly] of Object.entries(ERROR_MAP)) {
    if (raw.toLowerCase().includes(key.toLowerCase())) {
      return friendly;
    }
  }
  
  // If it looks technical (contains HTTP codes, function names, etc.), hide it
  if (
    /\b(500|502|503|504|401|403|422)\b/.test(raw) ||
    /function|invoke|fetch|network|cors|http/i.test(raw) ||
    raw.length > 120
  ) {
    return "Something went wrong. Please try again in a moment.";
  }
  
  return raw;
}
