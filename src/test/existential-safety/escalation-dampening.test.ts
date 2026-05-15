import { describe, expect, it } from "vitest";
import { detectRecursiveDistress } from "../../../lib/existential-safety/escalation-dampening/detectRecursiveDistress";
import { reduceInsightAmplification } from "../../../lib/existential-safety/escalation-dampening/reduceInsightAmplification";

describe("existential safety escalation dampening", () => {
  it("detects recursive distress language", () => {
    expect(
      detectRecursiveDistress("Everything feels harder and nothing is helping and it keeps getting worse."),
    ).toBe("elevated");
  });

  it("reduces insight count during heavier emotional states", () => {
    expect(
      reduceInsightAmplification({
        requestedCount: 3,
        emotionalLoad: "high",
        recursiveDistress: "elevated",
      }),
    ).toBe(1);
  });
});
