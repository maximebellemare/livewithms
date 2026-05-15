export function preventEndlessInteractionLoops(input: {
  visibleActionCount: number;
  hasSecondaryPrompts: boolean;
  attentionLoad: "low" | "moderate" | "high";
}) {
  return {
    limitSecondaryPrompts: input.attentionLoad !== "low" || input.hasSecondaryPrompts,
    maxSuggestedNextActions: input.attentionLoad === "high" ? 1 : 2,
    discourageChaining: true,
  };
}

