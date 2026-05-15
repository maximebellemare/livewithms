export function removePossessiveFraming(text: string) {
  return text
    .replace(/\bI(?:'m| am) here for you\b/gi, "This space can help you reflect")
    .replace(/\bYou can rely on me\b/gi, "You can return to reflection when it feels useful")
    .replace(/\bI understand exactly how you feel\b/gi, "I may not have the full picture of how this feels")
    .replace(/\bI(?:'ll| will) always be here\b/gi, "You can use this space when it feels supportive");
}
