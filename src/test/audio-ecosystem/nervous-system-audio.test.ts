import { describe, expect, it } from "vitest";
import { deriveCalmAudioPacing } from "../../../lib/audio-ecosystem/nervous-system-audio/deriveCalmAudioPacing";
import { preventEmotionalAudioManipulation } from "../../../lib/audio-ecosystem/nervous-system-audio/preventEmotionalAudioManipulation";

describe("audio ecosystem nervous-system-safe audio", () => {
  it("keeps calmer pacing for very gentle audio", () => {
    const result = deriveCalmAudioPacing("very-gentle");

    expect(result.maxClipSeconds).toBeLessThanOrEqual(60);
    expect(result.pauseSeconds).toBeGreaterThanOrEqual(4);
  });

  it("removes emotionally immersive audio phrasing", () => {
    const result = preventEmotionalAudioManipulation("I'm always here for you, just keep listening.");

    expect(result.toLowerCase()).not.toContain("always here for you");
    expect(result.toLowerCase()).not.toContain("keep listening");
  });
});
