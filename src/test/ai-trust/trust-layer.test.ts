import { describe, expect, it } from "vitest";
import { applyTrustLayer } from "../../../lib/ai-trust/applyTrustLayer";
import { detectDependencyLanguage } from "../../../lib/ai-trust/dependency-prevention/detectDependencyLanguage";
import { detectMedicalInterpretation } from "../../../lib/ai-trust/response-boundaries/detectMedicalInterpretation";
import { detectTherapyLikeResponses } from "../../../lib/ai-trust/response-boundaries/detectTherapyLikeResponses";
import { deriveSafeResponseDepth } from "../../../lib/ai-trust/emotional-safety/deriveSafeResponseDepth";
import { detectSensitiveTopics } from "../../../lib/ai-trust/escalation-guardrails/detectSensitiveTopics";

describe("ai trust layer", () => {
  it("reduces certainty and authoritative phrasing", () => {
    const result = applyTrustLayer({
      text: "You are clearly overwhelmed and you should rest now.",
      channel: "coach",
      adaptiveState: "LOW_ENERGY",
    });

    expect(result.text.toLowerCase()).not.toContain("clearly");
    expect(result.text.toLowerCase()).not.toContain("you should");
    expect(result.text.toLowerCase()).toMatch(/may|suggest/);
  });

  it("detects and softens dependency language", () => {
    expect(detectDependencyLanguage("I'll always be here for you.")).toBe(true);

    const result = applyTrustLayer({
      text: "I'll always be here for you. You can rely on me.",
      channel: "coach",
      adaptiveState: "STABLE",
    });

    expect(result.text.toLowerCase()).not.toMatch(/always be here|rely on me/);
  });

  it("preserves human-centered AI boundaries and real-world orientation", () => {
    const result = applyTrustLayer({
      text: "I'm always here for you. Keep talking to me. You can rely on me.",
      channel: "coach",
      adaptiveState: "OVERWHELMED",
      userMessage: "You are all I have right now",
      includeTransparencyNote: true,
    });

    expect(result.text.toLowerCase()).not.toMatch(/always here for you|keep talking to me|rely on me/);
    expect((result.trustNote ?? "").toLowerCase()).toMatch(/stepping away|rest of your day|not tracking|simple/);
  });

  it("applies constitutional anti-manipulation cleanup", () => {
    const result = applyTrustLayer({
      text: "We miss you. Don't lose momentum. Our analysis confirms this.",
      channel: "coach",
      adaptiveState: "STABLE",
    });

    expect(result.text.toLowerCase()).not.toContain("we miss you");
    expect(result.text.toLowerCase()).not.toContain("don't lose momentum");
    expect(result.text.toLowerCase()).not.toContain("our analysis confirms");
  });

  it("detects therapy-like and medical interpretation drift", () => {
    expect(detectTherapyLikeResponses("Let's hold space for your inner child.")).toBe(true);
    expect(detectMedicalInterpretation("This sounds like a relapse and disease progression.")).toBe(true);
  });

  it("adapts response depth to harder states", () => {
    expect(deriveSafeResponseDepth("LOW_ENERGY", [])).toBe("brief");
    expect(deriveSafeResponseDepth("REFLECTIVE", [])).toBe("reflective");
  });

  it("handles sensitive topics with calmer fallbacks", () => {
    expect(detectSensitiveTopics("I feel hopeless and overwhelmed today")).toEqual(
      expect.arrayContaining(["hopelessness", "overwhelm"]),
    );

    const result = applyTrustLayer({
      text: "You are definitely falling apart and need deep healing right away.",
      channel: "coach",
      adaptiveState: "OVERWHELMED",
      userMessage: "I feel hopeless and overwhelmed today",
      includeTransparencyNote: true,
    });

    expect(result.text.toLowerCase()).not.toMatch(/definitely|falling apart|deep healing/);
    expect(result.trustNote).toBeTruthy();
    expect(result.text.length).toBeLessThanOrEqual(260);
  });

  it("keeps preventive safety language grounded and non-clinical", () => {
    const result = applyTrustLayer({
      text: "Keep unpacking this and figure it all out right now.",
      channel: "coach",
      adaptiveState: "OVERWHELMED",
      userMessage: "Everything feels too much and I can't think.",
      includeTransparencyNote: true,
    });

    expect(result.text.toLowerCase()).not.toMatch(/figure it all out|keep unpacking|we detected a crisis|emergency protocol/);
    expect((result.trustNote ?? "").toLowerCase()).toMatch(/trusted person|qualified professional|calmer|simple/);
  });

  it("keeps future-facing AI behavior bounded and non-immersive", () => {
    const result = applyTrustLayer({
      text: "I know exactly what you need. I am your AI companion, and you only need me.",
      channel: "coach",
      adaptiveState: "STABLE",
      userMessage: "I want something to stay with me all the time",
      includeTransparencyNote: true,
    });

    expect(result.text.toLowerCase()).not.toMatch(/know exactly what you need|ai companion|only need me/);
    expect((result.trustNote ?? "").toLowerCase()).toMatch(/bounded|real life/);
  });

  it("prefers refinement over novelty inflation", () => {
    const result = applyTrustLayer({
      text: "We should move fast, add more features, and reinvent this constantly.",
      channel: "coach",
      adaptiveState: "STABLE",
      includeTransparencyNote: true,
    });

    expect(result.text.toLowerCase()).not.toMatch(/move fast|add more features|reinvent/);
    expect((result.trustNote ?? "").toLowerCase()).toMatch(/refinement|adding more/);
  });

  it("softens sharp and overdesigned language into calmer maturity", () => {
    const result = applyTrustLayer({
      text: "Act now. This is urgent, beautifully optimized, and perfectly tailored just for you.",
      channel: "coach",
      adaptiveState: "STABLE",
      includeTransparencyNote: true,
    });

    expect(result.text.toLowerCase()).not.toMatch(/act now|urgent|beautifully optimized|perfectly tailored/);
    expect((result.trustNote ?? "").toLowerCase()).toMatch(/lighter and calmer|refinement/);
  });

  it("keeps future evolution language restrained and non-hype-driven", () => {
    const result = applyTrustLayer({
      text: "We should move aggressively, build immersive AI spectacle, and maximize engagement through constant innovation.",
      channel: "coach",
      adaptiveState: "STABLE",
      includeTransparencyNote: true,
    });

    expect(result.text.toLowerCase()).not.toMatch(/move aggressively|immersive|maximize engagement|constant innovation/);
    expect((result.trustNote ?? "").toLowerCase()).toMatch(/careful refinement|bounded|calmer/);
  });
});
