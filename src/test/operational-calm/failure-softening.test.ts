import { describe, expect, it } from "vitest";
import { classifyFailureSeverity } from "../../../lib/operational-calm/failure-softening/classifyFailureSeverity";
import { deriveFriendlyFailureMessage } from "../../../lib/operational-calm/failure-softening/deriveFriendlyFailureMessage";
import { mapTechnicalErrors } from "../../../lib/operational-calm/failure-softening/mapTechnicalErrors";

describe("operational calm failure softening", () => {
  it("maps technical failures into calmer categories", () => {
    expect(mapTechnicalErrors(new Error("Network request failed"))).toBe("network");
    expect(mapTechnicalErrors(new Error("JWT expired"))).toBe("auth");
  });

  it("classifies blocking and minor failures appropriately", () => {
    expect(classifyFailureSeverity(new Error("auth session missing"))).toBe("blocking");
    expect(classifyFailureSeverity(new Error("Network request failed"))).toBe("minor");
  });

  it("returns emotionally calm user-facing messages", () => {
    expect(deriveFriendlyFailureMessage(new Error("Network request failed")).toLowerCase()).toContain("slow");
    expect(deriveFriendlyFailureMessage(new Error("temporary_failure")).toLowerCase()).toContain("pause");
  });
});
