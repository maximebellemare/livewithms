import { describe, expect, it } from "vitest";
import { deriveSimplificationSupport } from "../../../lib/preventive-safety/calm-grounding/deriveSimplificationSupport";
import { deriveGroundingTransitions } from "../../../lib/preventive-safety/calm-grounding/deriveGroundingTransitions";

describe("preventive safety calm grounding", () => {
  it("simplifies more strongly in elevated states", () => {
    expect(deriveSimplificationSupport("elevated").toLowerCase()).toContain("one small step");
  });

  it("uses grounding transitions instead of intensity", () => {
    expect(deriveGroundingTransitions("guarded").toLowerCase()).toContain("calmer surface");
  });
});
