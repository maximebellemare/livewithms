import { describe, expect, it } from "vitest";
import { sanitizeMedicalLanguage } from "../../../lib/longitudinal/safety/sanitizeMedicalLanguage";
import { validateObservationSafety } from "../../../lib/longitudinal/safety/validateObservationSafety";

describe("longitudinal safety", () => {
  it("softens medicalized wording", () => {
    expect(sanitizeMedicalLanguage("We detected your symptoms are getting worse.")).toContain(
      "some recent entries suggest",
    );
  });

  it("rejects unsafe certainty and escalation language", () => {
    const result = validateObservationSafety("Your symptoms are getting worse and you should be concerned.");
    expect(result.safe).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("allows gentle observational language", () => {
    const result = validateObservationSafety("Recent entries suggest more difficult fatigue days.");
    expect(result.safe).toBe(true);
    expect(result.sanitizedText).toBe("Recent entries suggest more difficult fatigue days.");
  });
});
