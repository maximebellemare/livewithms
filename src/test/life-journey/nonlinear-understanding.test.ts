import { describe, expect, it } from "vitest";
import { preserveLifeVariability } from "../../../lib/life-journey/nonlinear-understanding/preserveLifeVariability";
import { preventLinearRecoveryNarratives } from "../../../lib/life-journey/nonlinear-understanding/preventLinearRecoveryNarratives";

describe("life journey nonlinear understanding", () => {
  it("preserves variability instead of setback framing", () => {
    expect(preserveLifeVariability("This setback means you are off track.").toLowerCase()).not.toMatch(/setback|off track/);
  });

  it("removes linear recovery narratives", () => {
    expect(preventLinearRecoveryNarratives("Your healing journey transformed you.").toLowerCase()).not.toMatch(
      /healing journey|transformed you/,
    );
  });
});
