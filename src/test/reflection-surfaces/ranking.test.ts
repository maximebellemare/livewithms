import { describe, expect, it } from "vitest";
import { rankObservationCandidates } from "../../../lib/reflection-surfaces/observation-ranking/rankObservationCandidates";
import type { ReflectionSurfaceCard } from "../../../lib/reflection-surfaces/types";

const baseCards: ReflectionSurfaceCard[] = [
  {
    id: "quiet-win",
    kind: "quiet-win",
    title: "A gentle return still matters",
    body: "You have continued returning, even after harder stretches away.",
    source: "quiet-win",
    relatedMetrics: [],
    tone: "light",
    confidence: "light",
    recencyDays: 0,
    emotionalUsefulness: 1.2,
    timingScore: 1.3,
    repetitionKey: "quiet-win-returning",
  },
  {
    id: "heavy-observation",
    kind: "resilience-reflection",
    title: "Hard week",
    body: "Some recent reflections carried clear honesty about what has felt hard.",
    source: "longitudinal",
    relatedMetrics: ["stress"],
    tone: "deeper",
    confidence: "light",
    recencyDays: 1,
    emotionalUsefulness: 1,
    timingScore: 1,
    repetitionKey: "hard-week",
  },
  {
    id: "unsafe-observation",
    kind: "gentle-observation",
    title: "Unsafe wording",
    body: "Your symptoms are getting worse.",
    source: "longitudinal",
    relatedMetrics: ["fatigue"],
    tone: "light",
    confidence: "light",
    recencyDays: 0,
    emotionalUsefulness: 1,
    timingScore: 1,
    repetitionKey: "unsafe-wording",
  },
];

describe("rankObservationCandidates", () => {
  it("filters unsafe observations and prioritizes continuity for withdrawn states", () => {
    const ranked = rankObservationCandidates(
      baseCards,
      {
        adaptiveState: "WITHDRAWN",
        timing: {
          shouldDisplay: true,
          maxCards: 1,
          maxLength: "short",
          suppressHeavierCards: true,
          preferContinuity: true,
          allowDeeperReflection: false,
          densityKey: "focused",
        },
        preferredSupportStyle: "calm",
      },
      [],
    );

    expect(ranked.some((card) => card.id === "unsafe-observation")).toBe(false);
    expect(ranked[0]?.id).toBe("quiet-win");
  });

  it("filters repeated cards", () => {
    const ranked = rankObservationCandidates(
      baseCards,
      {
        adaptiveState: "STABLE",
        timing: {
          shouldDisplay: true,
          maxCards: 2,
          maxLength: "medium",
          suppressHeavierCards: false,
          preferContinuity: false,
          allowDeeperReflection: true,
          densityKey: "roomy",
        },
      },
      ["quiet-win-returning"],
    );

    expect(ranked.some((card) => card.id === "quiet-win")).toBe(false);
  });
});
