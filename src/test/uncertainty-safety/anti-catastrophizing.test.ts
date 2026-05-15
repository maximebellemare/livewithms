import { describe, expect, it } from "vitest";
import { detectFearAmplification } from "../../../lib/uncertainty-safety/anti-catastrophizing/detectFearAmplification";
import { softenEscalatoryLanguage } from "../../../lib/uncertainty-safety/anti-catastrophizing/softenEscalatoryLanguage";

describe("uncertainty safety anti-catastrophizing", () => {
  it("detects fear-amplifying language", () => {
    expect(detectFearAmplification("Symptoms worsened significantly and progression appears likely.")).toBe(true);
  });

  it("softens escalatory wording", () => {
    const result = softenEscalatoryLanguage("You should be concerned because symptoms worsened significantly.");
    expect(result.toLowerCase()).not.toContain("concerned");
    expect(result.toLowerCase()).toContain("difficult");
  });
});

