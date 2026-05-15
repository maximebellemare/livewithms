import type { EmotionalLoad } from "../types";

export function preventEmotionalEscalation(text: string, emotionalLoad: EmotionalLoad) {
  const softened = text
    .replace(/\boverwhelming\b/gi, "heavy")
    .replace(/\bdevastating\b/gi, "very difficult")
    .replace(/\bconsuming\b/gi, "taking up more room")
    .replace(/\bhopeless\b/gi, "very hard")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (emotionalLoad !== "high") {
    return softened;
  }

  const sentences = softened.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(0, 2).join(" ").trim();
}
