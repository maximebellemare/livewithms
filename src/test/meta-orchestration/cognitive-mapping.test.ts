import { describe, expect, it } from "vitest";
import { deriveSystemDependencies } from "../../../lib/meta-orchestration/cognitive-mapping/deriveSystemDependencies";
import { validateAdaptationChains } from "../../../lib/meta-orchestration/cognitive-mapping/validateAdaptationChains";

describe("meta orchestration cognitive mapping", () => {
  it("exposes stable dependency maps", () => {
    const deps = deriveSystemDependencies();
    expect(deps.aiTrustDependsOn).toContain("ethical-governance");
    expect(deps.todayDependsOn).toContain("system-coherence");
  });

  it("validates adaptation chains", () => {
    const result = validateAdaptationChains({
      activeSystems: ["ethical-governance", "system-coherence", "self-trust", "existential-safety"],
      requiredSystems: ["ethical-governance", "system-coherence"],
    });

    expect(result.valid).toBe(true);
  });
});
