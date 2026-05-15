import { describe, expect, it } from "vitest";
import { deriveNeutralMoments } from "../../../lib/existential-safety/breathing-room/deriveNeutralMoments";
import { deriveOrdinaryLifeSpacing } from "../../../lib/existential-safety/breathing-room/deriveOrdinaryLifeSpacing";

describe("existential safety breathing room", () => {
  it("creates a neutral moment when emotional load is high", () => {
    const note = deriveNeutralMoments("high");

    expect(note?.title).toBeTruthy();
    expect(note?.body.toLowerCase()).toContain("do not need to make meaning");
  });

  it("adds ordinary-life spacing for harder states", () => {
    expect(deriveOrdinaryLifeSpacing("OVERWHELMED")).toContain("Ordinary parts of the day");
  });
});
