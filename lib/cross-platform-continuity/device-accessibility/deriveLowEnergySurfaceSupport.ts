export function deriveLowEnergySurfaceSupport(input: {
  reduceVisualLoad: boolean;
  preferGlanceable: boolean;
}) {
  if (input.preferGlanceable) {
    return "Glanceable support can be enough on lower-energy days.";
  }

  if (input.reduceVisualLoad) {
    return "This surface can stay lower-load when reading or decision-making feels harder.";
  }

  return "Different devices can support different energy levels without changing the tone.";
}
