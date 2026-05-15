import { describe, expect, it } from "vitest";
import { deriveGentleReturnFlows } from "../../../lib/legacy-integrity/calm-reentry/deriveGentleReturnFlows";
import { preventGuiltReactivation } from "../../../lib/legacy-integrity/calm-reentry/preventGuiltReactivation";

describe("legacy integrity calm reentry", () => {
  it("supports return without emotional debt", () => {
    expect(deriveGentleReturnFlows({ hasHistory: true }).toLowerCase()).toContain("without guilt");
  });

  it("removes guilt-heavy reactivation copy", () => {
    expect(preventGuiltReactivation("You've been away too long. We've been waiting for you.").toLowerCase()).not.toMatch(/away too long|waiting for you/);
  });
});
