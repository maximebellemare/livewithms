export function preventSocialNoise(text: string) {
  return text
    .replace(/\bjoin the conversation\b/gi, "this can stay quiet")
    .replace(/\bsee what everyone is saying\b/gi, "notice a few shared themes")
    .replace(/\btrending\b/gi, "recently shared")
    .replace(/\s{2,}/g, " ")
    .trim();
}
