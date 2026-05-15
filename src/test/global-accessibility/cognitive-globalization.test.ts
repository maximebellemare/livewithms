import { describe, expect, it } from "vitest";
import { deriveLowLiteracyAccessibility } from "../../../lib/global-accessibility/cognitive-globalization/deriveLowLiteracyAccessibility";
import { deriveGlobalReadingModes } from "../../../lib/global-accessibility/cognitive-globalization/deriveGlobalReadingModes";

describe("global accessibility cognitive globalization", () => {
  it("supports simpler language when energy or complexity tolerance is low", () => {
    const result = deriveLowLiteracyAccessibility({
      lowerComplexity: true,
      lowEnergy: true,
    });

    expect(result.simplerLanguage).toBe(true);
    expect(result.summary.toLowerCase()).toMatch(/simple|shorter|easier/);
  });

  it("offers a lighter reading mode under lower capacity", () => {
    const result = deriveGlobalReadingModes({
      lowEnergy: true,
      lowerComplexity: true,
    });

    expect(result.mode).toBe("minimal");
  });
});
