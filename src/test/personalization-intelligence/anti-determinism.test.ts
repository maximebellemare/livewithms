import { describe, expect, it } from "vitest";
import { preventRigidProfiling } from "../../../lib/personalization-intelligence/anti-determinism/preventRigidProfiling";
import { preserveHumanVariability } from "../../../lib/personalization-intelligence/anti-determinism/preserveHumanVariability";

describe("personalization intelligence anti-determinism", () => {
  it("prevents rigid profiling language", () => {
    const result = preventRigidProfiling("We know you and this means you are the kind of person who always needs this.");

    expect(result.toLowerCase()).not.toContain("we know you");
    expect(result.toLowerCase()).not.toContain("the kind of person");
  });

  it("preserves variability in interpretation", () => {
    const result = preserveHumanVariability("This clearly and definitely fits exactly.");

    expect(result.toLowerCase()).toContain("variability");
    expect(result.toLowerCase()).not.toContain("definitely");
  });
});
