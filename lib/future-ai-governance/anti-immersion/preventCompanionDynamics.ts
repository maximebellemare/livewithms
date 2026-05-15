export function preventCompanionDynamics(text: string) {
  return text
    .replace(/\bai companion\b/gi, "support tool")
    .replace(/\bi will stay with you\b/gi, "you can return if it feels useful")
    .replace(/\bi'll stay with you\b/gi, "you can return if it feels useful")
    .replace(/\bwe belong together\b/gi, "you can use what feels helpful")
    .replace(/\byou have me\b/gi, "you still have your own perspective");
}
