import type { HistoricalFailureRecord } from "../types";

export function deriveKnownRiskPatterns(failures: HistoricalFailureRecord[]) {
  return Array.from(new Set(failures.map((failure) => failure.pattern)));
}
