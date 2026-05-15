export function preserveTrustDuringFailures(text: string) {
  return text
    .replace(/\beverything broke\b/gi, "things are a little unsettled")
    .replace(/\byour data is lost\b/gi, "your information may need a quieter retry")
    .replace(/\bfailed badly\b/gi, "did not go through this time")
    .replace(/\bbroken\b/gi, "unavailable for the moment");
}
