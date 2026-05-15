export function preventEmotionalOvercuration(text: string) {
  return text
    .replace(/\blook how far you've come\b/gi, "A longer view can stay gentle")
    .replace(/\byour struggle made you stronger\b/gi, "Hard stretches do not need to be turned into a lesson")
    .replace(/\bnever forget this feeling\b/gi, "It can be enough to notice this lightly");
}
