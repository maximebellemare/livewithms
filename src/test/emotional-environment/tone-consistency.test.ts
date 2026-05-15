import { describe, expect, it } from "vitest";
import { deriveUnifiedToneState } from "../../../lib/emotional-environment/tone-consistency/deriveUnifiedToneState";
import { validateToneConsistency } from "../../../lib/emotional-environment/tone-consistency/validateToneConsistency";

describe("emotional environment tone consistency", () => {
  it("flags emotionally disruptive or performative language", () => {
    const result = validateToneConsistency({
      atmosphere: "QUIET",
      text: "Urgent healing is happening now.",
    });

    expect(result.consistent).toBe(false);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("derives a stable unified tone state", () => {
    expect(deriveUnifiedToneState("RESTORATIVE")).toBe("restorative");
    expect(deriveUnifiedToneState("LIGHT")).toBe("steady");
  });
});

