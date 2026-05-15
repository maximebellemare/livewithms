import type { ObservationRankingContext, ReflectionSurfaceCard } from "../types";

function getKindWeight(card: ReflectionSurfaceCard, context: ObservationRankingContext) {
  if (context.timing.preferContinuity) {
    if (card.kind === "calming-continuity" || card.kind === "quiet-win") {
      return 3.2;
    }
  }

  if (context.adaptiveState === "LOW_ENERGY" || context.adaptiveState === "OVERWHELMED") {
    if (card.kind === "pacing-reinforcement" || card.kind === "quiet-win") {
      return 3;
    }
  }

  if (context.adaptiveState === "REFLECTIVE" && card.kind === "emotional-awareness") {
    return 3.1;
  }

  return card.kind === "gentle-observation" ? 2.4 : 2.7;
}

function getToneWeight(card: ReflectionSurfaceCard, context: ObservationRankingContext) {
  if (card.tone === "light") {
    return 2.2;
  }

  if (card.tone === "steady") {
    return context.timing.allowDeeperReflection ? 2 : 1.7;
  }

  return context.timing.allowDeeperReflection ? 1.8 : 0.8;
}

function getStyleWeight(card: ReflectionSurfaceCard, context: ObservationRankingContext) {
  switch (context.preferredSupportStyle) {
    case "calm":
      return card.kind === "calming-continuity" || card.kind === "pacing-reinforcement" ? 1.3 : 0.6;
    case "practical":
      return card.kind === "pacing-reinforcement" ? 1.4 : 0.6;
    case "reflective":
      return card.kind === "emotional-awareness" || card.kind === "resilience-reflection" ? 1.3 : 0.6;
    case "steady":
      return card.kind === "quiet-win" || card.kind === "gentle-observation" ? 1.1 : 0.6;
    default:
      return 0.6;
  }
}

export function scoreObservation(card: ReflectionSurfaceCard, context: ObservationRankingContext) {
  const recencyWeight = card.recencyDays === null ? 0.2 : Math.max(0, 2 - card.recencyDays * 0.18);
  const lengthWeight = context.timing.maxLength === "short" && card.body.length <= 110 ? 1.4 : 0.7;

  return (
    getKindWeight(card, context) +
    getToneWeight(card, context) +
    getStyleWeight(card, context) +
    card.emotionalUsefulness * 1.6 +
    card.timingScore * 1.2 +
    recencyWeight +
    lengthWeight
  );
}
