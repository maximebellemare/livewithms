import { LONGITUDINAL_DEFAULTS } from "../constants";
import { validateObservationSafety } from "../safety/validateObservationSafety";
import { buildUncertaintySafetySnapshot, moderateUncertaintyLanguage } from "../../uncertainty-safety/buildUncertaintySafetySnapshot";
import type {
  AdaptiveState,
  CorrelationPattern,
  EmotionalContext,
  LongitudinalObservation,
  LongitudinalWindowKey,
  RhythmPattern,
  TrendSummary,
} from "../types";

function buildObservation(
  input: Omit<LongitudinalObservation, "id" | "body"> & { body: string; entryCount?: number },
): LongitudinalObservation | null {
  const uncertaintySnapshot = buildUncertaintySafetySnapshot(
    Array.from({ length: input.entryCount ?? 0 }, () => ({
      date: "unknown",
      fatigue: null,
      stress: null,
      brain_fog: null,
      mood: null,
      sleep_hours: null,
      water_glasses: null,
      notes: null,
    })),
    "STABLE",
  );
  const moderated = moderateUncertaintyLanguage(input.body, uncertaintySnapshot);
  const safety = validateObservationSafety(moderated);
  if (!safety.safe) {
    return null;
  }

  return {
    ...input,
    id: `${input.source}-${input.windowKey}-${input.relatedMetrics.join("-")}`,
    body: safety.sanitizedText,
  };
}

export function generateObservations(input: {
  windowKey: LongitudinalWindowKey;
  entryCount: number;
  trendSummaries: TrendSummary[];
  rhythms: RhythmPattern[];
  correlations: CorrelationPattern[];
  emotionalContext: EmotionalContext;
  adaptiveState: AdaptiveState;
}): LongitudinalObservation[] {
  if (input.entryCount < LONGITUDINAL_DEFAULTS.minimumEntriesForObservations) {
    return [];
  }

  const observations: Array<LongitudinalObservation | null> = [];

  for (const trend of input.trendSummaries) {
    if (trend.direction === "unknown" || trend.direction === "flat") {
      continue;
    }

    const body =
      trend.direction === "up"
        ? `Some recent entries suggest ${trend.metric.replace(/_/g, " ")} has felt a little heavier in this period.`
        : `There seems to be a gentler shift in ${trend.metric.replace(/_/g, " ")} across this period.`;

    observations.push(
      buildObservation({
        title: `${trend.metric.replace(/_/g, " ")} pattern`,
        body,
        entryCount: input.entryCount,
        windowKey: input.windowKey,
        relatedMetrics: [trend.metric],
        confidence: "light",
        source: "trend",
      }),
    );
  }

  for (const rhythm of input.rhythms) {
    observations.push(
      buildObservation({
        title: rhythm.label,
        body: rhythm.description,
        entryCount: input.entryCount,
        windowKey: input.windowKey,
        relatedMetrics: [],
        confidence: rhythm.strength,
        source: "rhythm",
      }),
    );
  }

  for (const correlation of input.correlations) {
    observations.push(
      buildObservation({
        title: correlation.key.replace(/-/g, " "),
        body: correlation.description,
        entryCount: input.entryCount,
        windowKey: input.windowKey,
        relatedMetrics:
          correlation.key === "sleep-fatigue"
            ? ["sleep_hours", "fatigue"]
            : correlation.key === "stress-mood"
              ? ["stress", "mood"]
              : correlation.key === "hydration-fatigue"
                ? ["water_glasses", "fatigue"]
                : ["stress"],
        confidence: correlation.strength,
        source: "correlation",
      }),
    );
  }

  if (input.emotionalContext.dominantThemes.length > 0) {
    observations.push(
      buildObservation({
        title: "Reflection themes",
        body: input.emotionalContext.summary,
        entryCount: input.entryCount,
        windowKey: input.windowKey,
        relatedMetrics: [],
        confidence: "light",
        source: "reflection",
      }),
    );
  }

  if (input.adaptiveState.primary === "LOW_ENERGY") {
    observations.push(
      buildObservation({
        title: "Lower-energy stretch",
        body: "Recent entries may be asking for simpler support, fewer decisions, and gentler pacing.",
        entryCount: input.entryCount,
        windowKey: input.windowKey,
        relatedMetrics: ["fatigue", "brain_fog", "sleep_hours"],
        confidence: "moderate",
        source: "trend",
      }),
    );
  }

  return observations.filter((item): item is LongitudinalObservation => Boolean(item));
}
