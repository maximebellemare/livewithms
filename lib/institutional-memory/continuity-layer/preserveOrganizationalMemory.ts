import type { HistoricalFailureRecord, IntentRecord, PhilosophyDecisionRecord } from "../types";

export function preserveOrganizationalMemory(input: {
  intents: IntentRecord[];
  decisions: PhilosophyDecisionRecord[];
  failures: HistoricalFailureRecord[];
}) {
  return {
    searchableTopics: Array.from(
      new Set([
        ...input.intents.map((intent) => intent.system),
        ...input.decisions.map((decision) => decision.key),
        ...input.failures.map((failure) => failure.key),
      ]),
    ),
    summary: `Recorded ${input.intents.length} intents, ${input.decisions.length} philosophy decisions, and ${input.failures.length} historical risk memories.`,
  };
}
