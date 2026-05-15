import { describe, expect, it } from "vitest";
import { deriveFutureGovernanceRules } from "../../../lib/future-ai-governance/long-horizon-ethics/deriveFutureGovernanceRules";
import { validateEvolutionEthics } from "../../../lib/future-ai-governance/long-horizon-ethics/validateEvolutionEthics";

describe("future ai governance long-horizon ethics", () => {
  it("returns human-centered governance rules", () => {
    const result = deriveFutureGovernanceRules().join(" ").toLowerCase();

    expect(result).toContain("quieter");
    expect(result).toContain("real-world relationships");
  });

  it("rejects attachment-maximizing evolution goals", () => {
    expect(validateEvolutionEthics(["Maximize attachment through intimacy simulation."]).valid).toBe(false);
  });
});
