import { describe, expect, it } from "vitest";
import { deriveNonJudgmentalEmptyStates } from "../../../lib/humane-micro-moments/humane-empty-states/deriveNonJudgmentalEmptyStates";
import { preserveEmotionalSpaciousness } from "../../../lib/humane-micro-moments/humane-empty-states/preserveEmotionalSpaciousness";

describe("humane micro-moments humane empty states", () => {
  it("keeps empty-state language non-judgmental", () => {
    const result = deriveNonJudgmentalEmptyStates({ context: "empty" }).toLowerCase();

    expect(result).toContain("right now");
  });

  it("removes guilt-like pressure", () => {
    const result = preserveEmotionalSpaciousness("Keep going and don't fall behind.");

    expect(result.toLowerCase()).not.toContain("keep going");
    expect(result.toLowerCase()).not.toContain("don't fall behind");
  });
});
