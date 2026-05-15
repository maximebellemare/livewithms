export function documentTradeoffReasoning(input: {
  tradeoff: "growth-vs-restraint" | "personalization-vs-autonomy" | "intelligence-vs-calmness" | "engagement-vs-dignity";
}) {
  const reasoning =
    input.tradeoff === "growth-vs-restraint"
      ? "Growth should not justify louder or more manipulative product behavior."
      : input.tradeoff === "personalization-vs-autonomy"
        ? "Personalization should reduce effort without narrowing user agency."
        : input.tradeoff === "intelligence-vs-calmness"
          ? "More intelligence is only worthwhile when it preserves or improves calmness."
          : "Engagement should remain secondary to dignity and low-pressure support.";

  return {
    tradeoff: input.tradeoff,
    reasoning,
  };
}
