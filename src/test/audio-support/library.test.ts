import { describe, expect, it } from "vitest";
import { CALM_AUDIO_SESSIONS, getCalmAudioSessionByToolId } from "../../../features/audio-support/library";

describe("calm audio support library", () => {
  it("keeps bundled audio sessions short, offline-ready, and low-pressure", () => {
    expect(CALM_AUDIO_SESSIONS.length).toBeGreaterThanOrEqual(5);
    expect(
      CALM_AUDIO_SESSIONS.every(
        (session) =>
          session.cachedOffline &&
          session.totalSeconds <= 600 &&
          !`${session.title} ${session.description} ${session.whyItHelps} ${session.recommendation}`.toLowerCase().match(
            /transform|optimize|biohack|journey|healing frequencies|performance|unlock/,
          ),
      ),
    ).toBe(true);
  });

  it("uses calm premium gating metadata", () => {
    expect(CALM_AUDIO_SESSIONS.every((session) => session.premiumFeature === "calm_audio_support")).toBe(true);
  });

  it("provides interruption-safe phase structure", () => {
    const session = getCalmAudioSessionByToolId("sleep-decompression-flow");

    expect(session).not.toBeNull();
    expect(session?.supportsBackgroundResumption).toBe(true);
    expect(session?.phases.length).toBeGreaterThanOrEqual(3);
  });

  it("supports optional haptic pacing only where it stays gentle", () => {
    const breathingSession = getCalmAudioSessionByToolId("mentally-overloaded-reset");
    const sensorySession = getCalmAudioSessionByToolId("calming-sensory-reset");

    expect(breathingSession?.supportsHaptics).toBe(true);
    expect(sensorySession?.supportsHaptics).toBe(false);
  });

  it("includes calmer evening audio support without sleep-optimization language", () => {
    const session = getCalmAudioSessionByToolId("mentally-overloaded-tonight");

    expect(session).not.toBeNull();
    expect(`${session?.title} ${session?.description} ${session?.recommendation}`.toLowerCase()).not.toMatch(
      /optimize|biohack|perfect routine|sleep intelligence/,
    );
  });
});
