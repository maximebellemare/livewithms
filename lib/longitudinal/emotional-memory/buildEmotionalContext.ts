import { summarizeReflectionThemes } from "./summarizeReflectionThemes";
import { adaptiveToneState } from "./adaptiveToneState";
import type { AdaptiveState, EmotionalContext, LongitudinalEntry } from "../types";

export function buildEmotionalContext(
  entries: LongitudinalEntry[],
  adaptiveState: AdaptiveState,
): EmotionalContext {
  const reflections = entries
    .map((entry) => entry.notes ?? entry.reflection_text ?? "")
    .map((text) => text.trim())
    .filter(Boolean)
    .slice(0, 8);

  const dominantThemes = summarizeReflectionThemes(reflections);
  const combinedText = reflections.join(" ").toLowerCase();

  let recentTone: EmotionalContext["recentTone"] = "unclear";
  if (/(overwhelm|heavy|hard|drained|foggy)/.test(combinedText)) {
    recentTone = "heavy";
  } else if (/(helped|steady|calmer|gentle|better)/.test(combinedText)) {
    recentTone = "encouraging";
  } else if (reflections.length >= 2) {
    recentTone = "mixed";
  } else if (reflections.length === 1) {
    recentTone = "steady";
  }

  const baseSupportStyle: EmotionalContext["supportStyle"] =
    recentTone === "heavy" ? "grounding" : dominantThemes.some((theme) => theme.label === "planning") ? "practical" : "steady";

  const provisionalContext: EmotionalContext = {
    dominantThemes,
    recentTone,
    supportStyle: baseSupportStyle,
    summary:
      reflections.length === 0
        ? "Reflections are still light, so emotional patterns are only beginning to take shape."
        : dominantThemes.length
          ? `Over time, your reflections often return to ${dominantThemes.map((theme) => theme.label).join(", ")}.`
          : "Your reflections are starting to add more emotional context over time.",
  };

  return {
    ...provisionalContext,
    supportStyle: adaptiveToneState(adaptiveState, provisionalContext),
  };
}
