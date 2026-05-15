export function preventCaregiverOverload(text: string): string {
  return text
    .replace(/\byou need to\b/gi, "it may help to")
    .replace(/\byou should\b/gi, "you may want to")
    .replace(/\bit is your job to\b/gi, "it may be helpful to")
    .replace(/\bwatch closely\b/gi, "stay gently aware")
    .replace(/\bkeep a close eye on\b/gi, "notice");
}
