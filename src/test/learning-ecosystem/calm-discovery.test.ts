import { describe, expect, it } from "vitest";
import { deriveIntentionalDiscovery } from "../../../lib/learning-ecosystem/calm-discovery/deriveIntentionalDiscovery";
import { preventInfiniteKnowledgeLoops } from "../../../lib/learning-ecosystem/calm-discovery/preventInfiniteKnowledgeLoops";

describe("learning ecosystem calm discovery", () => {
  it("limits discovery under higher educational load", () => {
    const discovery = deriveIntentionalDiscovery({
      educationalLoad: "high",
      learningIntensity: "very-light",
    });

    expect(discovery.maxSuggestions).toBe(1);
    expect(discovery.preferSinglePath).toBe(true);
  });

  it("prevents infinite knowledge-loop phrasing", () => {
    const result = preventInfiniteKnowledgeLoops("Keep reading and dive deeper into the next recommended topic.");

    expect(result.toLowerCase()).not.toContain("keep reading");
    expect(result.toLowerCase()).not.toContain("next recommended");
  });
});
