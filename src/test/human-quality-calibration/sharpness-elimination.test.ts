import { describe, expect, it } from "vitest";
import { detectEmotionalSharpness } from "../../../lib/human-quality-calibration/sharpness-elimination/detectEmotionalSharpness";
import { softenAbruptTransitions } from "../../../lib/human-quality-calibration/sharpness-elimination/softenAbruptTransitions";

describe("human quality calibration sharpness elimination", () => {
  it("detects emotional sharpness", () => {
    expect(detectEmotionalSharpness("This is urgent and you must act now.").sharp).toBe(true);
  });

  it("softens abrupt transitions", () => {
    expect(softenAbruptTransitions("Act now and respond immediately.").toLowerCase()).not.toMatch(/act now|immediately/);
  });
});
