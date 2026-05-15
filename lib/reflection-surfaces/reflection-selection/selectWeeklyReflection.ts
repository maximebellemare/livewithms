import { rankObservationCandidates } from "../observation-ranking/rankObservationCandidates";
import { shouldDisplayObservation } from "../display-timing/shouldDisplayObservation";
import type { ReflectionSelectionInput, ReflectionSurfaceCard, ReflectionTiming } from "../types";

export function selectWeeklyReflection(
  input: ReflectionSelectionInput,
  timing: ReflectionTiming,
): ReflectionSurfaceCard[] {
  if (!timing.allowDeeperReflection || input.entries.length < 5) {
    return [];
  }

  const monthlyWindow = input.analysis.windows.find((window) => window.key === "monthly");
  if (!monthlyWindow || monthlyWindow.daysLogged < 5) {
    return [];
  }

  const candidates: ReflectionSurfaceCard[] = input.analysis.trendSummaries
    .filter((summary) => summary.direction !== "unknown" && summary.direction !== "flat")
    .map((summary) => ({
      id: `weekly-${summary.metric}-${summary.direction}`,
      kind: summary.metric === "mood" ? "resilience-reflection" : "gentle-observation",
      title: `${summary.metric.replace(/_/g, " ")} over time`,
      body: summary.summary,
      source: "longitudinal",
      relatedMetrics: [summary.metric],
      tone: summary.metric === "mood" ? "steady" : "light",
      confidence: "light",
      recencyDays: 2,
      emotionalUsefulness: 0.8,
      timingScore: 0.8,
      repetitionKey: `weekly-${summary.metric}`,
    }));

  return rankObservationCandidates(
    candidates.filter((candidate) => shouldDisplayObservation(candidate, timing)),
    {
      adaptiveState: input.adaptiveState.primary,
      timing,
      preferredSupportStyle: input.preferredSupportStyle,
    },
    input.recentCardIds,
  ).slice(0, Math.min(1, timing.maxCards));
}
