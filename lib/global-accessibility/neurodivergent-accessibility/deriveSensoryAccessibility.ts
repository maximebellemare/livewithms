type Input = {
  lowStimPreferred?: boolean;
  sensorySensitive?: boolean;
};

export function deriveSensoryAccessibility({ lowStimPreferred = false, sensorySensitive = false }: Input) {
  const reducedStimulus = lowStimPreferred || sensorySensitive;

  return {
    reducedStimulus,
    summary: reducedStimulus
      ? "Lower-stimulation support can help the experience stay calmer and easier to process."
      : "Support can stay visually and emotionally steady across different sensory needs.",
  };
}
