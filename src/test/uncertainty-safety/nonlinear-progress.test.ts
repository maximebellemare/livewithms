import { describe, expect, it } from "vitest";
import { preventLinearRecoveryNarratives } from "../../../lib/uncertainty-safety/nonlinear-progress/preventLinearRecoveryNarratives";
import { softenProgressInterpretation } from "../../../lib/uncertainty-safety/nonlinear-progress/softenProgressInterpretation";

describe("uncertainty safety nonlinear progress", () => {
  it("prevents linear recovery narratives", () => {
    const result = preventLinearRecoveryNarratives("You are backsliding after a setback.");
    expect(result.toLowerCase()).not.toContain("backsliding");
    expect(result.toLowerCase()).not.toContain("setback");
  });

  it("softens progress interpretation", () => {
    const result = softenProgressInterpretation("You are improving and making progress.");
    expect(result.toLowerCase()).not.toContain("improving");
    expect(result.toLowerCase()).not.toContain("progress");
  });
});

