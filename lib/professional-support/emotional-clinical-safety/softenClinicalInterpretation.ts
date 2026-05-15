export function softenClinicalInterpretation(text: string): string {
  return text
    .replace(/\bworsening\b/gi, "feeling heavier")
    .replace(/\bdecline\b/gi, "more difficulty")
    .replace(/\bprogression\b/gi, "recent change")
    .replace(/\bsignificant\b/gi, "notable");
}
