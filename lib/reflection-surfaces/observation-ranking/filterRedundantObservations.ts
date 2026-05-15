import type { ReflectionSurfaceCard } from "../types";

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function filterRedundantObservations(
  cards: ReflectionSurfaceCard[],
  recentCardIds: string[] = [],
): ReflectionSurfaceCard[] {
  const seen = new Set(recentCardIds.flatMap((id) => [normalizeKey(id), normalizeKey(`:${id}:`)]));
  const unique: ReflectionSurfaceCard[] = [];

  for (const card of cards) {
    const metricKey = [...card.relatedMetrics].sort().join("-");
    const redundancyKey = normalizeKey(`${card.repetitionKey}:${metricKey}:${card.kind}`);
    const bodyKey = normalizeKey(card.body);
    const idKey = normalizeKey(card.id);
    const repetitionKey = normalizeKey(card.repetitionKey);

    if (seen.has(redundancyKey) || seen.has(bodyKey) || seen.has(idKey) || seen.has(repetitionKey)) {
      continue;
    }

    seen.add(redundancyKey);
    seen.add(bodyKey);
    seen.add(idKey);
    seen.add(repetitionKey);
    unique.push(card);
  }

  return unique;
}
