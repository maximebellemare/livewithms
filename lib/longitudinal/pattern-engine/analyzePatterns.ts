import { buildEmotionalContext } from "../emotional-memory/buildEmotionalContext";
import { deriveCognitiveLoad } from "../adaptive-state/deriveCognitiveLoad";
import { deriveFatigueState } from "../adaptive-state/deriveFatigueState";
import { deriveInteractionDensity } from "../adaptive-state/deriveInteractionDensity";
import { detectCorrelations } from "./detectCorrelations";
import { detectRhythms } from "./detectRhythms";
import { calculateTrendWindows } from "../trend-analysis/calculateTrendWindows";
import { generateTrendSummary } from "../trend-analysis/generateTrendSummary";
import { generateObservations } from "./generateObservations";
import { buildLifeContextSnapshot } from "../../life-context/buildLifeContextSnapshot";
import { injectContextualAwareness } from "../../life-context/contextual-reflections/injectContextualAwareness";
import type { AdaptiveState, LongitudinalAnalysis, LongitudinalEntry } from "../types";

function buildAdaptiveState(entries: LongitudinalEntry[]): AdaptiveState {
  const fatigueSignal = deriveFatigueState(entries);
  const cognitiveSignal = deriveCognitiveLoad(entries);
  const interactionSignal = deriveInteractionDensity(entries);

  const signals = Array.from(new Set([fatigueSignal, cognitiveSignal, interactionSignal]));
  const primary =
    signals.find((signal) => signal === "LOW_ENERGY") ??
    signals.find((signal) => signal === "OVERWHELMED") ??
    signals.find((signal) => signal === "WITHDRAWN") ??
    signals.find((signal) => signal === "REFLECTIVE") ??
    "STABLE";

  return {
    primary,
    signals,
    reduceUiDensity: primary === "LOW_ENERGY" || primary === "OVERWHELMED" || primary === "WITHDRAWN",
    shortenPrompts: primary === "LOW_ENERGY" || primary === "OVERWHELMED",
    softenCoachTone: primary !== "STABLE",
    lowerNotificationPressure: primary === "LOW_ENERGY" || primary === "WITHDRAWN",
  };
}

export function analyzePatterns(entries: LongitudinalEntry[]): LongitudinalAnalysis {
  const sortedEntries = [...entries].sort((left, right) => right.date.localeCompare(left.date));
  const windowsMap = calculateTrendWindows(sortedEntries);
  const windows = [windowsMap.weekly, windowsMap.monthly, windowsMap.rolling];
  const adaptiveState = buildAdaptiveState(sortedEntries);
  const emotionalContext = buildEmotionalContext(sortedEntries, adaptiveState);
  const rhythms = detectRhythms(sortedEntries);
  const correlations = detectCorrelations(sortedEntries);
  const lifeContext = buildLifeContextSnapshot(sortedEntries);
  const trendSummaries = [
    generateTrendSummary(windowsMap.weekly, "fatigue"),
    generateTrendSummary(windowsMap.weekly, "stress"),
    generateTrendSummary(windowsMap.weekly, "brain_fog"),
    generateTrendSummary(windowsMap.weekly, "mood"),
    generateTrendSummary(windowsMap.weekly, "sleep_hours"),
  ];
  const observations = injectContextualAwareness(
    generateObservations({
      windowKey: "weekly",
      entryCount: sortedEntries.length,
      trendSummaries,
      rhythms,
      correlations,
      emotionalContext,
      adaptiveState,
    }),
    lifeContext,
  );

  return {
    windows,
    adaptiveState,
    emotionalContext,
    rhythms,
    correlations,
    trendSummaries,
    observations,
  };
}
