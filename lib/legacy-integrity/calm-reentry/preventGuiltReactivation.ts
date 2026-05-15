export function preventGuiltReactivation(text: string) {
  return text
    .replace(/\byou've been away too long\b/gi, "time away is okay")
    .replace(/\bwe've been waiting for you\b/gi, "you can return if it helps")
    .replace(/\byou should get back on track\b/gi, "you can begin from where you are");
}
