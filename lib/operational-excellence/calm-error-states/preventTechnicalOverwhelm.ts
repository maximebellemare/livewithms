export function preventTechnicalOverwhelm(text: string) {
  return text
    .replace(/\bexception\b/gi, "issue")
    .replace(/\brequest payload\b/gi, "request")
    .replace(/\btransport error\b/gi, "connection issue")
    .replace(/\bstack trace\b/gi, "technical details")
    .replace(/\bdebug\b/gi, "details");
}
