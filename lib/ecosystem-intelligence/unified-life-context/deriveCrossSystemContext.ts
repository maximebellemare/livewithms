type Input = {
  learningActive: boolean;
  cognitionActive: boolean;
  audioActive: boolean;
  ambientActive: boolean;
  continuityActive: boolean;
  personalizationActive: boolean;
};

export function deriveCrossSystemContext(input: Input) {
  const activeSystems = [
    input.learningActive ? "learning" : null,
    input.cognitionActive ? "cognition" : null,
    input.audioActive ? "audio" : null,
    input.ambientActive ? "ambient" : null,
    input.continuityActive ? "continuity" : null,
    input.personalizationActive ? "personalization" : null,
  ].filter(Boolean) as string[];

  return {
    activeSystems,
    summary:
      activeSystems.length > 3
        ? "Several support layers are available, so coordination matters more than adding more guidance."
        : "Support can stay gathered into one calmer context rather than many separate signals.",
  };
}
