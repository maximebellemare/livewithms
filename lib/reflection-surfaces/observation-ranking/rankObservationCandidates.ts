import { LONGITUDINAL_BLOCKED_PATTERNS } from "../../longitudinal/constants";
import { validateObservationSafety } from "../../longitudinal/safety/validateObservationSafety";
import { filterRedundantObservations } from "./filterRedundantObservations";
import { scoreObservation } from "./scoreObservation";
import type { ObservationRankingContext, ReflectionSurfaceCard } from "../types";

export function rankObservationCandidates(
  cards: ReflectionSurfaceCard[],
  context: ObservationRankingContext,
  recentCardIds: string[] = [],
) {
  const safeCards = cards
    .map((card) => {
      const normalizedOriginal = card.body.toLowerCase();
      if (LONGITUDINAL_BLOCKED_PATTERNS.some((pattern) => normalizedOriginal.includes(pattern))) {
        return null;
      }

      const safety = validateObservationSafety(card.body);
      if (!safety.safe) {
        return null;
      }

      return {
        ...card,
        body: safety.sanitizedText,
      };
    })
    .filter((card): card is ReflectionSurfaceCard => Boolean(card));

  return filterRedundantObservations(safeCards, recentCardIds).sort(
    (left, right) => scoreObservation(right, context) - scoreObservation(left, context),
  );
}
