import { describe, expect, it } from "vitest";
import { deriveSystemMaps } from "../../../lib/sustainability-architecture/developer-cognitive-load/deriveSystemMaps";
import { generateArchitectureAnnotations } from "../../../lib/sustainability-architecture/developer-cognitive-load/generateArchitectureAnnotations";

describe("sustainability architecture developer cognitive load", () => {
  it("builds stable system maps", () => {
    const maps = deriveSystemMaps();
    expect(maps.length).toBeGreaterThan(0);
    expect(maps[0].dependsOn.length).toBeGreaterThan(0);
  });

  it("generates readable annotations", () => {
    const notes = generateArchitectureAnnotations(deriveSystemMaps());
    expect(notes[0]).toContain("depends on");
    expect(notes[0]).toContain("protects");
  });
});
