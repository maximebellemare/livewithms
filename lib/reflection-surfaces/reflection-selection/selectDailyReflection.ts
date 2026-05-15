import { rankObservationCandidates } from "../observation-ranking/rankObservationCandidates";
import { shouldDisplayObservation } from "../display-timing/shouldDisplayObservation";
import { generateQuietWinObservation } from "../quiet-wins/generateQuietWinObservation";
import { detectQuietWins } from "../quiet-wins/detectQuietWins";
import type { ReflectionSelectionInput, ReflectionSurfaceCard, ReflectionTiming } from "../types";

function deriveCandidateKind(source: ReflectionSurfaceCard["source"], observationSource: "trend" | "rhythm" | "correlation" | "reflection") {
  if (source === "quiet-win") {
    return "quiet-win";
  }

  switch (observationSource) {
    case "reflection":
      return "emotional-awareness";
    case "correlation":
      return "calming-continuity";
    case "rhythm":
      return "gentle-observation";
    case "trend":
    default:
      return "pacing-reinforcement";
  }
}

function mapLongitudinalObservations(input: ReflectionSelectionInput): ReflectionSurfaceCard[] {
  return input.analysis.observations.map((observation) => ({
    id: observation.id,
    kind: deriveCandidateKind("longitudinal", observation.source),
    title: observation.title,
    body: observation.body,
    source: "longitudinal",
    relatedMetrics: observation.relatedMetrics,
    tone: observation.source === "reflection" ? "steady" : observation.source === "correlation" ? "steady" : "light",
    confidence: observation.confidence,
    recencyDays: 0,
    emotionalUsefulness:
      observation.source === "reflection" ? 1.2 : observation.source === "correlation" ? 1.1 : 0.9,
    timingScore: input.adaptiveState.primary === "LOW_ENERGY" && observation.source === "trend" ? 1.2 : 0.8,
    repetitionKey: observation.id,
  }));
}

function buildContinuityCard(input: ReflectionSelectionInput): ReflectionSurfaceCard | null {
  if (input.entries.length === 0) {
    return null;
  }

  if (input.lifecycleStage === "returning") {
    return {
      id: "continuity-returning",
      kind: "calming-continuity",
      title: "A small return still counts",
      body: "Coming back after a harder stretch can still be a meaningful reset point.",
      source: "continuity",
      relatedMetrics: [],
      tone: "light",
      confidence: "light",
      recencyDays: 0,
      emotionalUsefulness: 1.1,
      timingScore: 1.4,
      repetitionKey: "continuity-returning",
    };
  }

  if (input.adaptiveState.primary === "WITHDRAWN") {
    return {
      id: "continuity-withdrawn",
      kind: "calming-continuity",
      title: "You can keep this light",
      body: "Even a small check-in can help the week feel a little easier to understand.",
      source: "continuity",
      relatedMetrics: [],
      tone: "light",
      confidence: "light",
      recencyDays: 0,
      emotionalUsefulness: 1,
      timingScore: 1.3,
      repetitionKey: "continuity-withdrawn",
    };
  }

  return null;
}

export function selectDailyReflection(
  input: ReflectionSelectionInput,
  timing: ReflectionTiming,
): ReflectionSurfaceCard[] {
  const candidates: ReflectionSurfaceCard[] = [];
  candidates.push(...mapLongitudinalObservations(input));

  for (const signal of detectQuietWins(input.entries, input.analysis.emotionalContext)) {
    const quietWin = generateQuietWinObservation(signal);
    if (quietWin) {
      candidates.push(quietWin);
    }
  }

  const continuityCard = buildContinuityCard(input);
  if (continuityCard) {
    candidates.push(continuityCard);
  }

  const ranked = rankObservationCandidates(
    candidates.filter((candidate) => shouldDisplayObservation(candidate, timing)),
    {
      adaptiveState: input.adaptiveState.primary,
      timing,
      preferredSupportStyle: input.preferredSupportStyle,
    },
    input.recentCardIds,
  );

  return ranked.slice(0, timing.maxCards);
}
