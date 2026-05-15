export function reduceBiometricFixation(text: string): string {
  return text
    .replace(/\bheart rate\b/gi, "body signal")
    .replace(/\bbiometric(?:s)?\b/gi, "passive signal")
    .replace(/\btrack constantly\b/gi, "check less often")
    .replace(/\bwatch closely\b/gi, "notice gently");
}
