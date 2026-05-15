export function preserveProductIdentity(input: {
  hasCalmTone: boolean;
  hasEmotionalRestraint: boolean;
  hasHumanCenteredAI: boolean;
}) {
  return {
    stable: input.hasCalmTone && input.hasEmotionalRestraint && input.hasHumanCenteredAI,
    identity:
      input.hasCalmTone && input.hasEmotionalRestraint
        ? "restrained human-centered calm intelligence"
        : "identity-at-risk",
  };
}
