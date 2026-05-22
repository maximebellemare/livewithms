import { describe, expect, it } from "vitest";
import { deriveStateSurfacePresentation } from "../../../lib/calm-environment";
import type { CalmEnvironmentState } from "../../../lib/calm-environment";

function buildState(overrides: Partial<CalmEnvironmentState> = {}): CalmEnvironmentState {
  return {
    available: true,
    active: true,
    title: "Calm environment",
    body: "A quieter presentation is available.",
    density: {
      mode: "standard",
      spacingMultiplier: 1,
      maxVisibleSections: 5,
      prefersShorterReading: false,
      label: "Standard mode",
      largerTapTargets: false,
      simplifyHierarchy: false,
    },
    motion: {
      reducedMotion: false,
      motionScale: 1,
      feedbackDelayMs: 0,
      pressFadeMs: 120,
      settleMs: 180,
      reduceAnimationIntensity: false,
      softenHaptics: false,
    },
    sensory: {
      quieterPalette: false,
      lowerVisualNoise: false,
      calmerContrast: false,
      spaciousReading: false,
      softerLoadingStates: false,
      nightCalm: false,
      reducedStimulus: false,
    },
    readability: {
      spaciousReading: false,
      lineHeightScale: 1,
      reduceTextWalls: false,
      easierScanning: false,
      simplerHierarchy: false,
    },
    lowEnergyPresentation: {
      active: false,
      shortenReading: false,
      reduceSimultaneousActions: false,
      simplifySecondaryContent: false,
      preserveFunctionality: true,
    },
    interactionPacing: {
      slowerTransitions: false,
      largerTapTargets: false,
      interruptionSafe: true,
      preserveUnfinishedState: true,
      calmerReentry: true,
    },
    ...overrides,
  };
}

describe("calm environment state surface presentation", () => {
  it("reduces density for low-energy presentation without shrinking the surface harshly", () => {
    const result = deriveStateSurfacePresentation(
      buildState({
        lowEnergyPresentation: {
          active: true,
          shortenReading: true,
          reduceSimultaneousActions: true,
          simplifySecondaryContent: true,
          preserveFunctionality: true,
        },
        readability: {
          spaciousReading: false,
          lineHeightScale: 1,
          reduceTextWalls: true,
          easierScanning: true,
          simplerHierarchy: true,
        },
      }),
    );

    expect(result.skeletonLines).toBe(2);
    expect(result.alignActionsStretch).toBe(true);
    expect(result.cardPaddingVertical).toBeGreaterThanOrEqual(22);
  });

  it("switches to a softer static loading indicator when motion is reduced", () => {
    const result = deriveStateSurfacePresentation(
      buildState({
        motion: {
          reducedMotion: true,
          motionScale: 0.8,
          feedbackDelayMs: 0,
          pressFadeMs: 120,
          settleMs: 180,
          reduceAnimationIntensity: true,
          softenHaptics: true,
        },
        readability: {
          spaciousReading: true,
          lineHeightScale: 1.08,
          reduceTextWalls: true,
          easierScanning: true,
          simplerHierarchy: false,
        },
      }),
    );

    expect(result.useStaticLoadingIndicator).toBe(true);
    expect(result.maxWidth).toBeGreaterThan(388);
    expect(result.reduceTextWalls).toBe(true);
  });
});
