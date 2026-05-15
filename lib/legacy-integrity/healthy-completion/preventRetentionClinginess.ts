export function preventRetentionClinginess(text: string) {
  return text
    .replace(/\bwe miss you\b/gi, "you can return whenever it feels useful")
    .replace(/\bdon't lose your progress\b/gi, "your history remains yours")
    .replace(/\bcome back soon\b/gi, "come back only if it fits");
}
