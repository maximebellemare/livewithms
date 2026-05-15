export function preventSurveillanceDynamics(text: string): string {
  return text
    .replace(/\bmonitor(?:ing)?\b/gi, "sharing context")
    .replace(/\boversight\b/gi, "support")
    .replace(/\balert(?:s)?\b/gi, "updates")
    .replace(/\btrack(?:ing)? closely\b/gi, "checking in gently")
    .replace(/\breal-time\b/gi, "as-needed")
    .replace(/\bwatch for\b/gi, "notice");
}
