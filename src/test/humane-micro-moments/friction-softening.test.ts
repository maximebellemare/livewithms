import { describe, expect, it } from "vitest";
import { deriveGentleRecoveryFlows } from "../../../lib/humane-micro-moments/friction-softening/deriveGentleRecoveryFlows";
import { softenSaveMoments } from "../../../lib/humane-micro-moments/friction-softening/softenSaveMoments";

describe("humane micro-moments friction softening", () => {
  it("softens save moments", () => {
    const result = softenSaveMoments("See you tomorrow. Small steps count");

    expect(result.toLowerCase()).not.toContain("see you tomorrow");
  });

  it("derives gentle recovery copy", () => {
    const result = deriveGentleRecoveryFlows({ state: "retry" }).toLowerCase();

    expect(result).toContain("gentle retry");
  });
});
