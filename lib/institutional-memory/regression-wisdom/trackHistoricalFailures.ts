import type { HistoricalFailureRecord } from "../types";

export function trackHistoricalFailures(input: {
  architectureAnnotations: string[];
  drifted: boolean;
}) : HistoricalFailureRecord[] {
  const failures: HistoricalFailureRecord[] = [];

  if (input.drifted) {
    failures.push({
      key: "philosophical-drift",
      pattern: "calmness or autonomy protections weakened under scale pressure",
      impact: "the product risks becoming louder or more controlling",
      prevention: "tighten shared governance and simplify adaptive behavior",
    });
  }

  if (input.architectureAnnotations.some((item) => item.includes("depends on"))) {
    failures.push({
      key: "hidden-coupling",
      pattern: "important systems become coupled without clear rationale",
      impact: "future teams may repeat regressions or miss safety assumptions",
      prevention: "keep dependencies and intent annotations visible",
    });
  }

  return failures;
}
