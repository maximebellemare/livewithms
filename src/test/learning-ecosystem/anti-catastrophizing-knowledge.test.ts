import { describe, expect, it } from "vitest";
import { softenMedicalFearLanguage } from "../../../lib/learning-ecosystem/anti-catastrophizing-knowledge/softenMedicalFearLanguage";
import { preventFearContentClustering } from "../../../lib/learning-ecosystem/anti-catastrophizing-knowledge/preventFearContentClustering";

describe("learning ecosystem anti catastrophizing knowledge", () => {
  it("softens fear-based medical phrasing", () => {
    const result = softenMedicalFearLanguage("Signs your MS is worsening and symptoms you should worry about.");

    expect(result.toLowerCase()).not.toContain("worsening");
    expect(result.toLowerCase()).not.toContain("worry about");
  });

  it("prevents fear-content clustering under higher load", () => {
    const count = preventFearContentClustering({
      requestedCount: 3,
      hasProgressionTone: true,
      educationalLoad: "high",
    });

    expect(count).toBe(1);
  });
});
