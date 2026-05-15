export function preventRigidProfiling(text: string): string {
  return text
    .replace(/\bthe kind of person who\b/gi, "someone who may sometimes")
    .replace(/\bthis means you are\b/gi, "this may reflect")
    .replace(/\byou are the kind of person who\b/gi, "you may sometimes find that")
    .replace(/\bwe know you\b/gi, "one pattern may suggest")
    .replace(/\balways\b/gi, "often");
}
