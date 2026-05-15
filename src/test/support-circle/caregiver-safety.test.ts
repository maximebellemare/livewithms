import { describe, expect, it } from "vitest";
import { deriveBoundaryProtection } from "../../../lib/support-circle/caregiver-safety/deriveBoundaryProtection";
import { preventCaregiverOverload } from "../../../lib/support-circle/caregiver-safety/preventCaregiverOverload";

describe("support circle caregiver safety", () => {
  it("softens responsibility-heavy language", () => {
    const result = preventCaregiverOverload("You need to watch closely and keep a close eye on symptoms.");

    expect(result.toLowerCase()).not.toContain("watch closely");
    expect(result.toLowerCase()).not.toContain("need to");
  });

  it("preserves practical rather than supervisory boundaries", () => {
    const result = deriveBoundaryProtection("caregiver");

    expect(result.toLowerCase()).toContain("practical");
    expect(result.toLowerCase()).not.toContain("supervis");
  });
});
