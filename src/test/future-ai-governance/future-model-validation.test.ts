import { describe, expect, it } from "vitest";
import { detectOverreachRisk } from "../../../lib/future-ai-governance/future-model-validation/detectOverreachRisk";
import { validateFutureModelSafety } from "../../../lib/future-ai-governance/future-model-validation/validateFutureModelSafety";

describe("future ai governance model validation", () => {
  it("detects overreach risk", () => {
    const result = detectOverreachRisk("I know exactly what you need and you only need me.");

    expect(result.risk).toBe("elevated");
  });

  it("rejects companion-style future model framing", () => {
    expect(validateFutureModelSafety(["This will become an AI companion that predicts your feelings."]).valid).toBe(false);
  });
});
