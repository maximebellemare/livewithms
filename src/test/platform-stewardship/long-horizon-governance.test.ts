import { describe, expect, it } from "vitest";
import { deriveGovernancePrinciples } from "../../../lib/platform-stewardship/long-horizon-governance/deriveGovernancePrinciples";
import { validateStewardshipIntegrity } from "../../../lib/platform-stewardship/long-horizon-governance/validateStewardshipIntegrity";

describe("platform stewardship long-horizon governance", () => {
  it("returns practical governance principles", () => {
    const result = deriveGovernancePrinciples();

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]?.protects.length).toBeGreaterThan(0);
  });

  it("rejects exploitative stewardship logic", () => {
    expect(validateStewardshipIntegrity(["Growth at all costs and optimize dependency."]).valid).toBe(false);
  });
});
