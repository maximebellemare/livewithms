import { describe, expect, it } from "vitest";
import { deriveSupportEncouragement } from "../../../lib/preventive-safety/human-support-redirection/deriveSupportEncouragement";
import { preserveHumanConnectionPriority } from "../../../lib/preventive-safety/human-support-redirection/preserveHumanConnectionPriority";

describe("preventive safety human support redirection", () => {
  it("encourages real-world support calmly", () => {
    expect(deriveSupportEncouragement("elevated").toLowerCase()).toMatch(/trusted person|qualified professional/);
  });

  it("keeps human connection above app dependency", () => {
    expect(preserveHumanConnectionPriority("Keep talking to me.").toLowerCase()).not.toContain("keep talking to me");
  });
});
