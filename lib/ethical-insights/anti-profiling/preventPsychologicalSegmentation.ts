export function preventPsychologicalSegmentation(text: string): string {
  return text
    .replace(/\bemotionally vulnerable cohort\b/gi, "people who may need gentler support")
    .replace(/\bhigh-value distressed users\b/gi, "people during difficult periods")
    .replace(/\bretention-prone segment\b/gi, "returning groups")
    .replace(/\bpsychological profile\b/gi, "support context")
    .replace(/\bvulnerability segment\b/gi, "broad support group");
}
