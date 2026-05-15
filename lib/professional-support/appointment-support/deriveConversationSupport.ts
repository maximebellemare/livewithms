export function deriveConversationSupport(input: {
  fatigueAverage: number | null;
  brainFogAverage?: number | null;
}) {
  if ((input.fatigueAverage ?? 0) >= 4 || (input.brainFogAverage ?? 0) >= 4) {
    return "Shorter explanations and written notes may help if appointments feel harder to navigate right now.";
  }

  return "A short summary and one or two questions may be enough to guide the conversation.";
}
