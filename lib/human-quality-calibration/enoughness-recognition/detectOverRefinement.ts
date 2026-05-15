export function detectOverRefinement(input: {
  microcopyLayers: number;
  guardrailNotes: number;
  refinementPasses: number;
}) {
  const overRefined =
    input.microcopyLayers > 4 || input.guardrailNotes > 2 || input.refinementPasses > 3;

  return {
    overRefined,
    reasons: overRefined ? ["over-refinement-risk"] : [],
  };
}
