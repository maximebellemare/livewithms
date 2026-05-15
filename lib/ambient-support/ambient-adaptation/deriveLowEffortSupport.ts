export function deriveLowEffortSupport(input: {
  reducePromptDensity: boolean;
  shortenReflections: boolean;
}) {
  if (input.reducePromptDensity && input.shortenReflections) {
    return "Support can stay lighter today with fewer prompts and shorter reflections.";
  }

  if (input.reducePromptDensity) {
    return "A lighter touch may help today, with fewer prompts competing for attention.";
  }

  return "Ambient support can stay in the background unless it becomes useful.";
}
