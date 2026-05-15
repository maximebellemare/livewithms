import { describe, expect, it } from "vitest";
import { deriveReflectionDensity } from "../../../lib/cognitive-simplification/density-regulation/deriveReflectionDensity";
import { deriveInsightClustering } from "../../../lib/cognitive-simplification/density-regulation/deriveInsightClustering";

describe("cognitive simplification density regulation", () => {
  it("limits reflection density during high burden", () => {
    const density = deriveReflectionDensity({
      adaptiveStatePrimary: "LOW_ENERGY",
      burden: "high",
    });

    expect(density.maxCards).toBe(1);
    expect(density.allowDeeperCards).toBe(false);
  });

  it("reduces insight clustering in minimal disclosure", () => {
    const clustering = deriveInsightClustering({
      burden: "high",
      disclosureDepth: "minimal",
    });

    expect(clustering.maxCorrelations).toBe(1);
    expect(clustering.showProgressSummary).toBe(false);
  });
});
