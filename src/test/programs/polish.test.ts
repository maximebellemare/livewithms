import { describe, expect, it } from "vitest";
import {
  deriveProgramCategoryLabel,
  derivePremiumProgramsCopy,
  deriveProgramSectionLabel,
  deriveProgramSectionSubtitle,
  deriveRecommendedProgramCopy,
} from "../../../features/programs/polish";
import type { ProgramModule } from "../../../features/programs/types";

const module: ProgramModule = {
  id: "energy-support",
  title: "Energy support",
  section: "Energy",
  track: "energy-management",
  description: "Low-energy guidance for days when doing less may help more.",
  whyItHelps: "Protecting energy early can make the rest of the day feel steadier.",
  estimatedPace: "2 minutes",
  toolIds: ["low-energy-checklist"],
  content: [],
};

describe("program polish helpers", () => {
  it("maps sections to calmer scanning labels", () => {
    expect(deriveProgramSectionLabel("Calm")).toBe("Grounding");
    expect(deriveProgramSectionLabel("Planning")).toBe("Pacing");
    expect(deriveProgramSectionLabel("Rest")).toBe("Sleep and rest");
    expect(deriveProgramSectionSubtitle("Rest")).toContain("sleep");
  });

  it("keeps recommendation copy gentle in low-energy states", () => {
    const result = deriveRecommendedProgramCopy({
      module,
      lowEnergyMode: true,
      highFatigue: true,
      overwhelmed: false,
    });

    expect(result.label).toContain("quieter");
    expect(`${result.label} ${result.body}`.toLowerCase()).not.toMatch(/must|complete|finish|achievement|streak/);
  });

  it("keeps premium library copy calm and non-optimizing", () => {
    const result = derivePremiumProgramsCopy({
      lowEnergyMode: true,
      overwhelmed: false,
      highFatigue: true,
    });

    expect(result.body.toLowerCase()).toContain("low-energy support");
    expect(`${result.title} ${result.body}`.toLowerCase()).not.toMatch(/transform|optimize|performance|unlock/);
  });

  it("maps calmer program category labels", () => {
    expect(deriveProgramCategoryLabel("brain-fog")).toBe("Brain fog");
    expect(deriveProgramCategoryLabel("emotional-regulation")).toBe("Emotional decompression");
  });
});
