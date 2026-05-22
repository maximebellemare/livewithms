import { describe, expect, it } from "vitest";
import { deriveCategoryDefiningPositioning } from "../../../lib/product-identity/deriveCategoryDefiningPositioning";
import { detectCategoryDrift, preventCategoryDrift } from "../../../lib/product-identity/preventCategoryDrift";

describe("product identity category-defining positioning", () => {
  it("keeps top-level positioning emotionally coherent and category-distinct", () => {
    const result = deriveCategoryDefiningPositioning();
    const combined = [
      result.appStoreDescription,
      result.appStoreSubtitle,
      result.onboardingSubtitle,
      result.termsSubtitle,
      result.identitySummary,
      ...result.differentiators,
    ]
      .join(" ")
      .toLowerCase();

    expect(combined).toContain("calm");
    expect(combined).toContain("emotionally safe");
    expect(combined).not.toMatch(
      /ai-powered|advanced analytics|mental health transformation|biohack|productivity recovery|ai companion|life coaching/,
    );
  });

  it("detects and softens category drift language", () => {
    const drift = detectCategoryDrift(
      "An AI-powered companion with advanced analytics to optimize your life and track everything.",
    );
    const softened = preventCategoryDrift(
      "An AI-powered companion with advanced analytics to optimize your life and track everything.",
    ).toLowerCase();

    expect(drift.drifted).toBe(true);
    expect(softened).not.toMatch(/ai-powered|advanced analytics|track everything|optimi[sz]e/);
  });
});
