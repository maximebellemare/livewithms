export function preventEmotionalConversion(text: string): string {
  return text
    .replace(/\bunlock emotional support\b/gi, "unlock deeper support tools")
    .replace(/\bupgrade for recovery\b/gi, "premium adds more depth if useful")
    .replace(/\bpay to feel okay\b/gi, "premium remains optional")
    .replace(/\byou need premium\b/gi, "premium is optional");
}
