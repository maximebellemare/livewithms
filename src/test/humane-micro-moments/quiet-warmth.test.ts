import { describe, expect, it } from "vitest";
import { deriveSubtleHumanWarmth } from "../../../lib/humane-micro-moments/quiet-warmth/deriveSubtleHumanWarmth";
import { preventOverfamiliarity } from "../../../lib/humane-micro-moments/quiet-warmth/preventOverfamiliarity";

describe("humane micro-moments quiet warmth", () => {
  it("keeps warmth subtle", () => {
    const result = deriveSubtleHumanWarmth({ surface: "save" }).toLowerCase();

    expect(result).toContain("quietly");
  });

  it("removes overfamiliar wording", () => {
    const result = preventOverfamiliarity("We're in this together, friend.");

    expect(result.toLowerCase()).not.toContain("friend");
    expect(result.toLowerCase()).not.toContain("we're in this together");
  });
});
