import { describe, expect, it } from "vitest";
import { PROGRAM_MODULES, PROGRAM_TOOLS, getProgramToolsByModuleId } from "../../../features/programs/catalog";
import { getCalmAudioSessionByToolId } from "../../../features/audio-support/library";

describe("program catalog", () => {
  it("includes a richer premium library across calmer support categories", () => {
    const premiumModules = PROGRAM_MODULES.filter((module) => module.premiumFeature === "guided_programs");

    expect(premiumModules.length).toBeGreaterThanOrEqual(9);
    expect(premiumModules.some((module) => module.category === "overwhelm")).toBe(true);
    expect(premiumModules.some((module) => module.category === "sleep")).toBe(true);
    expect(premiumModules.some((module) => module.category === "brain-fog")).toBe(true);
    expect(premiumModules.some((module) => module.id === "cognitive-simplification")).toBe(true);
    expect(premiumModules.some((module) => module.id === "difficult-day-support")).toBe(true);
    expect(premiumModules.some((module) => module.id === "emotional-reset-rituals")).toBe(true);
    expect(premiumModules.some((module) => module.id === "mental-exhaustion-recovery")).toBe(true);
  });

  it("keeps premium tools interruption-safe and calm", () => {
    const premiumTools = PROGRAM_TOOLS.filter((tool) => tool.premiumFeature === "guided_programs");

    expect(premiumTools.length).toBeGreaterThanOrEqual(21);
    expect(premiumTools.some((tool) => tool.id === "sixty-second-quiet-reset")).toBe(true);
    expect(premiumTools.some((tool) => tool.id === "reduce-stimulation-guide")).toBe(true);
    expect(premiumTools.some((tool) => tool.id === "cognitive-decompression-reset")).toBe(true);
    expect(premiumTools.some((tool) => tool.id === "too-many-thoughts-at-once")).toBe(true);
    expect(premiumTools.some((tool) => tool.id === "one-thing-at-a-time")).toBe(true);
    expect(premiumTools.some((tool) => tool.id === "everything-feels-too-hard")).toBe(true);
    expect(premiumTools.some((tool) => tool.id === "i-cant-do-much-today")).toBe(true);
    expect(premiumTools.some((tool) => tool.id === "slow-things-down-reset")).toBe(true);
    expect(premiumTools.some((tool) => tool.id === "nervous-system-downshift")).toBe(true);
    expect(premiumTools.some((tool) => tool.id === "reduce-emotional-carryover")).toBe(true);
    expect(premiumTools.some((tool) => tool.id === "empty-tank-support")).toBe(true);
    expect(premiumTools.some((tool) => tool.id === "mental-rest-permission")).toBe(true);
    expect(premiumTools.some((tool) => tool.id === "slower-recovery-pacing")).toBe(true);
    expect(
      premiumTools.every(
        (tool) =>
          typeof tool.completionMessage === "string" &&
          typeof tool.continuationLabel === "string" &&
          !`${tool.title} ${tool.description} ${tool.completionMessage}`.toLowerCase().match(/streak|achievement|crush|transform|optimize|peak focus|performance|push through|stay strong/),
      ),
    ).toBe(true);
  });

  it("keeps module tool wiring intact", () => {
    const sleepModuleTools = getProgramToolsByModuleId("sleep-support");

    expect(sleepModuleTools.length).toBeGreaterThanOrEqual(2);
    expect(sleepModuleTools.every((tool) => tool.moduleId === "sleep-support")).toBe(true);
  });

  it("links calmer audio support to heavier-day tools", () => {
    const audioLinkedTools = PROGRAM_TOOLS.filter((tool) => Boolean(getCalmAudioSessionByToolId(tool.id)));

    expect(audioLinkedTools.length).toBeGreaterThanOrEqual(5);
    expect(audioLinkedTools.every((tool) => tool.premiumFeature === "guided_programs")).toBe(true);
  });
});
