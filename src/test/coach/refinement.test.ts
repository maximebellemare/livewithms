import { describe, expect, it } from "vitest";
import {
  detectCoachLowEnergyMode,
  detectCoachOverwhelm,
  deriveCoachFallbackState,
  deriveCoachStarterSuggestions,
  softenCoachAssistantText,
} from "../../../features/coach/refinement";

describe("coach refinement", () => {
  it("detects low-energy mode from explicit setting and fatigue context", () => {
    expect(detectCoachLowEnergyMode({ lowEnergyMode: true })).toBe(true);
    expect(
      detectCoachLowEnergyMode({
        fatigue: 4,
        sleepHours: 5,
        adaptiveFatigueTrend: "high",
      }),
    ).toBe(true);
  });

  it("detects overwhelm from stress, fog, and message language", () => {
    expect(detectCoachOverwhelm({ stress: 4 })).toBe(true);
    expect(detectCoachOverwhelm({ brainFog: 4 })).toBe(true);
    expect(detectCoachOverwhelm({ message: "I feel overwhelmed and I can't think." })).toBe(true);
  });

  it("returns calmer starter suggestions for overwhelmed states", () => {
    const result = deriveCoachStarterSuggestions({
      stress: 5,
      message: "Everything feels too much right now.",
    });

    expect(result).toEqual(
      expect.arrayContaining(["Everything feels too much right now", "Help me make this smaller and steadier"]),
    );
  });

  it("softens attachment language and trims response density", () => {
    const result = softenCoachAssistantText(
      "I'm always here for you. I understand you deeply. You should rest now. What feels hardest? What else is going on? I will stay with you.",
      {
        lowEnergyMode: true,
        fatigue: 4,
        message: "I am exhausted.",
      },
    );

    expect(result.toLowerCase()).not.toMatch(/always here for you|understand you deeply|stay with you/);
    expect(result.toLowerCase()).not.toContain("you should");
    expect((result.match(/\?/g) ?? []).length).toBeLessThanOrEqual(1);
    expect(result.length).toBeLessThanOrEqual(221);
  });

  it("provides a calm local fallback during reconnection", () => {
    const fallback = deriveCoachFallbackState({
      lowEnergyMode: true,
      fatigue: 4,
      sleepHours: 5,
    });

    expect(fallback.body.toLowerCase()).toContain("reconnect");
    expect(fallback.suggestions.length).toBeGreaterThan(0);
  });

  it("keeps evening support shorter and quieter", () => {
    const result = softenCoachAssistantText(
      "The evening can still be productive. Here are several things to try tonight. What feels hardest? What else is on your mind?",
      {
        timeOfDay: "evening",
      },
    );

    expect((result.match(/\?/g) ?? []).length).toBeLessThanOrEqual(1);
    expect(result.length).toBeLessThanOrEqual(300);
  });

  it("offers calmer starter suggestions during decision-heavy moments", () => {
    const result = deriveCoachStarterSuggestions({
      message: "There are too many things and I need help deciding what matters most.",
    });

    expect(result).toEqual(
      expect.arrayContaining(["Too many things feel important", "What matters most right now?"]),
    );
  });

  it("offers calmer recovery-oriented fallbacks during stacked hard days", () => {
    const result = deriveCoachFallbackState({
      message: "I feel burned out and like there has been no recovery time lately.",
    });

    expect(result.title).toContain("steadier pace");
    expect(result.body.toLowerCase()).toContain("protecting recovery time");
  });

  it("offers calmer communication-oriented fallbacks without coaching dynamics", () => {
    const result = deriveCoachFallbackState({
      message: "I feel misunderstood and I do not know how to explain my fatigue without a big conversation.",
    });

    expect(result.title).toContain("simpler explanation");
    expect(result.body.toLowerCase()).toContain("long explanation");
  });

  it("offers calmer future-pressure fallbacks without false reassurance", () => {
    const result = deriveCoachFallbackState({
      message: "I keep spiraling about the future and this week feels heavy.",
    });

    expect(result.title).toContain("future");
    expect(result.body.toLowerCase()).toContain("solve the future tonight");
    expect(result.body.toLowerCase()).not.toMatch(/you've got this|everything happens for a reason/);
  });

  it("offers identity and future fear support without reassurance or self-help framing", () => {
    const result = deriveCoachFallbackState({
      message:
        "I am afraid of the future and of becoming unrecognizable. What if my life keeps shrinking and I lose myself?",
    });

    expect(result.title.toLowerCase()).toMatch(/future|unknown/);
    expect(result.body.toLowerCase()).toContain("solve the whole future tonight");
    expect(result.body.toLowerCase()).not.toMatch(
      /conquer fear|transform your mindset|ai emotional resilience|everything happens for a reason|therapy|self-help|inspirational/,
    );
  });

  it("offers self-trust support without therapy or false-reassurance framing", () => {
    const result = deriveCoachFallbackState({
      message:
        "I do not trust my body right now and I keep monitoring every feeling because symptoms feel unpredictable.",
    });

    expect(result.title.toLowerCase()).toContain("trust");
    expect(result.body.toLowerCase()).toContain("monitor every feeling so intensely");
    expect(result.body.toLowerCase()).not.toMatch(
      /mind-body healing|optimi[sz]e your nervous system|ai emotional regulation|biohack|therapy|self-help|spiritual|you are safe/,
    );
  });

  it("offers future-fear recovery support without reassurance or self-help framing", () => {
    const result = deriveCoachFallbackState({
      message:
        "I keep spiraling about what happens next and I am scared everything will get worse and I will lose stability.",
    });

    expect(result.title.toLowerCase()).toMatch(/horizon|future/);
    expect(result.body.toLowerCase()).toContain("emotionally solve the future tonight");
    expect(result.body.toLowerCase()).not.toMatch(
      /future mastery|fear transformation|ai resilience system|everything will be okay|therapy|self-help|inspirational|manifest a better future/,
    );
  });

  it("offers reorientation support without life-coaching or self-help framing", () => {
    const result = deriveCoachFallbackState({
      message:
        "I feel lost and emotionally disoriented. I do not know what matters anymore and I have no direction right now.",
    });

    expect(result.title.toLowerCase()).toContain("direction");
    expect(result.body.toLowerCase()).toContain("complete direction right now");
    expect(result.body.toLowerCase()).not.toMatch(
      /discover your purpose|life transformation|ai life coaching|find your true path|therapy|self-help|inspirational/,
    );
  });

  it("offers breathing-room support without mindfulness or therapy framing", () => {
    const result = deriveCoachFallbackState({
      message:
        "Everything feels urgent and emotionally stacked. I feel rushed and like every pressure has to be solved now.",
    });

    expect(result.title.toLowerCase()).toContain("pace");
    expect(result.body.toLowerCase()).toContain("immediate emotional resolution");
    expect(result.body.toLowerCase()).not.toMatch(
      /master mindfulness|optimi[sz]e your nervous system|ai emotional regulation|therapy|self-help|spiritual|performance/,
    );
  });

  it("offers everyday-life rebuilding support without productivity or motivational framing", () => {
    const result = deriveCoachFallbackState({
      message:
        "Ordinary life feels hard to re-enter and normal activities feel overwhelming. I want smaller steps back into routine.",
    });

    expect(result.title.toLowerCase()).toContain("ordinary life");
    expect(result.body.toLowerCase()).toContain("rebuild everything all at once");
    expect(result.body.toLowerCase()).not.toMatch(
      /take your life back|rebuild stronger|ai life recovery|productivity|therapy|self-help|motivational|get back to normal/,
    );
  });

  it("offers self-reconnection support without transformation or self-help framing", () => {
    const result = deriveCoachFallbackState({
      message:
        "I do not feel like myself anymore and I feel far from myself after this long difficult stretch.",
    });

    expect(result.title.toLowerCase()).toContain("familiarity");
    expect(result.body.toLowerCase()).toContain("still be yourself");
    expect(result.body.toLowerCase()).not.toMatch(
      /rediscover yourself|transform your identity|ai emotional healing|find your true self|therapy|self-help|inspirational|reinvention/,
    );
  });

  it("offers existential grounding support without therapy or self-help framing", () => {
    const result = deriveCoachFallbackState({
      message: "I keep thinking what is the point and everything feels empty and existential right now.",
    });

    expect(result.title.toLowerCase()).toContain("questions");
    expect(result.body.toLowerCase()).toContain("resolve every difficult question right now");
    expect(result.body.toLowerCase()).not.toMatch(
      /discover your purpose|transform your mindset|ai existential guidance|therapy|self-help|spiritual|purpose discovery/,
    );
  });

  it("offers emotional-collapse support without crisis or therapy framing", () => {
    const result = deriveCoachFallbackState({
      message: "Everything feels too much and I feel emotionally flooded and shut down after overwhelm.",
    });

    expect(result.title.toLowerCase()).toContain("smaller");
    expect(result.body.toLowerCase()).toContain("emotionally solve everything right now");
    expect(result.body.toLowerCase()).not.toMatch(
      /emotional healing|ai crisis support|mental resilience mastery|therapy|self-help|crisis|mental toughness|inspirational/,
    );
  });

  it("offers grief support without therapy or inspirational framing", () => {
    const result = deriveCoachFallbackState({
      message:
        "I feel grief about the old version of life and sadness about what changed. I should be over this but I am not.",
    });

    expect(result.title.toLowerCase()).toMatch(/loss|grief|heavy/);
    expect(result.body.toLowerCase()).toContain("emotionally resolve everything immediately");
    expect(result.body.toLowerCase()).not.toMatch(
      /heal your grief|transform your pain|ai emotional healing|healing journey|therapy|self-help|inspirational|grief counseling/,
    );
  });

  it("offers ordinary-life grounding fallbacks without illness-centrality or inspiration framing", () => {
    const result = deriveCoachFallbackState({
      message: "I need help remembering who I am outside symptoms and ordinary life feels far away.",
    });

    expect(result.title.toLowerCase()).toContain("ordinary life");
    expect(result.body.toLowerCase()).toContain("ordinary part of life");
    expect(result.body.toLowerCase()).not.toMatch(/warrior|healing journey|inspirational|stronger/);
  });

  it("offers quieter meaning support without self-help or pseudo-philosophy framing", () => {
    const result = deriveCoachFallbackState({
      message: "I feel emotionally lost and I do not know what still matters anymore.",
    });

    expect(result.title.toLowerCase()).toContain("meaning");
    expect(result.body.toLowerCase()).toContain("does not need to feel dramatic");
    expect(result.body.toLowerCase()).not.toMatch(/find your true purpose|everything happens for a reason|spiritual|transform your mindset/);
  });

  it("offers steadiness support without motivational framing or false reassurance", () => {
    const result = deriveCoachFallbackState({
      message: "I feel emotionally shaken and scared of another bad day because I lose trust in myself after symptoms flare.",
    });

    expect(result.title.toLowerCase()).toMatch(/steady|steadier/);
    expect(result.body.toLowerCase()).toContain("may not define the whole pattern");
    expect(result.body.toLowerCase()).not.toMatch(/be fearless|be stronger|you've got this|conquer your mindset|mental toughness/);
  });

  it("offers uncertainty support without false reassurance or mindset framing", () => {
    const result = deriveCoachFallbackState({
      message: "Everything feels uncertain and I keep spiraling about the future because my brain won't settle.",
    });

    expect(result.title.toLowerCase()).toContain("unknown");
    expect(result.body.toLowerCase()).toContain("solve the future all at once");
    expect(result.body.toLowerCase()).not.toMatch(/everything will be okay|you've got this|mindset|mental toughness|resilience/);
  });

  it("offers nonlinearity support without therapy or spiritual framing", () => {
    const result = deriveCoachFallbackState({
      message: "Why can't I stay stable? Everything feels up and down and nonlinear right now.",
    });

    expect(result.title.toLowerCase()).toContain("perfection");
    expect(result.body.toLowerCase()).toContain("less steady than others");
    expect(result.body.toLowerCase()).not.toMatch(
      /master uncertainty|emotional resilience optimization|ai emotional mastery|radical acceptance|spiritual|surrender|therapy|self-help/,
    );
  });

  it("offers overload-recovery support without therapy or social-performance framing", () => {
    const result = deriveCoachFallbackState({
      message: "I feel mentally drained after too much people and noise and I need quieter input now.",
    });

    expect(result.title.toLowerCase()).toContain("quiet");
    expect(result.body.toLowerCase()).toContain("decompression");
    expect(result.body.toLowerCase()).not.toMatch(/therapy|social resilience|mental toughness|be more resilient socially/);
  });

  it("offers fear-recovery support without medical reassurance or therapy framing", () => {
    const result = deriveCoachFallbackState({
      message: "Everything suddenly feels scary and symptoms feel overwhelming and I can't stop worrying.",
    });

    expect(result.title.toLowerCase()).toContain("fear");
    expect(result.body.toLowerCase()).toContain("interpret everything immediately");
    expect(result.body.toLowerCase()).not.toMatch(/you are fine|panic treatment|anxiety therapy|medical reassurance/);
  });

  it("offers flare-period support without medical or diagnostic framing", () => {
    const result = deriveCoachFallbackState({
      message: "Today feels like a flare and too many symptoms feel loud at once and I need to simplify the day.",
    });

    expect(result.title.toLowerCase()).toContain("gentler pace");
    expect(result.body.toLowerCase()).toContain("less pressure");
    expect(result.body.toLowerCase()).not.toMatch(/diagnosis|treatment|medical advice|ai health monitoring/);
  });

  it("offers emotional-spaciousness support without therapy or spiritual framing", () => {
    const result = deriveCoachFallbackState({
      message: "I keep fighting myself and feel trapped by needing clarity right now and I need less internal pressure.",
    });

    expect(result.title.toLowerCase()).toContain("pressure");
    expect(result.body.toLowerCase()).toContain("solve every feeling immediately");
    expect(result.body.toLowerCase()).not.toMatch(/radical acceptance|spiritual|therapy|transform your mindset|emotional healing/);
  });

  it("offers quiet-hope support without motivational or inspirational framing", () => {
    const result = deriveCoachFallbackState({
      message: "This hard stretch feels final and discouraging and like nothing will improve.",
    });

    expect(result.title.toLowerCase()).toContain("steadier");
    expect(result.body.toLowerCase()).toContain("may not define everything ahead");
    expect(result.body.toLowerCase()).not.toMatch(/find hope again|everything happens for a reason|you've got this|mindset transformation|inspirational/);
  });

  it("offers emotional-numbness support without therapy or self-help framing", () => {
    const result = deriveCoachFallbackState({
      message: "I feel emotionally numb and flat and nothing feels real or meaningful right now.",
    });

    expect(result.title.toLowerCase()).toContain("reconnection");
    expect(result.body.toLowerCase()).toContain("force yourself to feel differently immediately");
    expect(result.body.toLowerCase()).not.toMatch(
      /heal emotional numbness|ai emotional healing|transform your emotional life|therapy|self-help|find joy/,
    );
  });

  it("offers life-reconnection support without self-help or emotional-intensity framing", () => {
    const result = deriveCoachFallbackState({
      message: "I feel disconnected and checked out and need a gentler way to reconnect with ordinary life.",
    });

    expect(result.title.toLowerCase()).toContain("life");
    expect(result.body.toLowerCase()).toContain("reconnect with everything at once");
    expect(result.body.toLowerCase()).not.toMatch(/rediscover yourself|transform your life|live your best life|ai emotional healing|inspirational/);
  });

  it("offers isolation grounding support without companion or dependency framing", () => {
    const result = deriveCoachFallbackState({
      message: "I feel lonely, unseen, and disconnected from people right now.",
    });

    expect(result.title.toLowerCase()).toContain("connection");
    expect(result.body.toLowerCase()).toContain("more disconnected than others");
    expect(result.body.toLowerCase()).not.toMatch(
      /always here for you|ai companion|fight loneliness|you are never alone|companion/,
    );
  });

  it("offers identity-continuity support without transformational or therapy framing", () => {
    const result = deriveCoachFallbackState({
      message: "I do not feel like myself during this change and everything feels fragmented.",
    });

    expect(result.title.toLowerCase()).toContain("steadier");
    expect(result.body.toLowerCase()).toContain("without disappearing");
    expect(result.body.toLowerCase()).not.toMatch(
      /reinvent yourself|identity transformation|ai self-discovery|finding your true self|therapy|self-help/,
    );
  });

  it("offers long-term stability support without life-coach or self-help framing", () => {
    const result = deriveCoachFallbackState({
      message: "I feel pressure to figure everything out and create a perfect long term plan.",
    });

    expect(result.title.toLowerCase()).toContain("steadier");
    expect(result.body.toLowerCase()).toContain("figure everything out all at once");
    expect(result.body.toLowerCase()).not.toMatch(
      /life mastery|ai life coaching|transform your future|purpose optimization|build your best life|therapy|self-help/,
    );
  });

  it("offers imperfect-day support without therapy or mindset framing", () => {
    const result = deriveCoachFallbackState({
      message: "I failed today and feel inconsistent and like one bad day means everything is ruined.",
    });

    expect(result.title.toLowerCase()).toContain("imperfect");
    expect(result.body.toLowerCase()).toContain("interpret that as failure");
    expect(result.body.toLowerCase()).not.toMatch(
      /master resilience|optimize your mindset|ai emotional transformation|therapy|self-help|toxic positivity/,
    );
  });

  it("offers emotional-reset support without therapy or spiritual framing", () => {
    const result = deriveCoachFallbackState({
      message: "Everything feels too loud and I am still carrying this and need to slow things down.",
    });

    expect(result.title.toLowerCase()).toContain("quieter");
    expect(result.body.toLowerCase()).toContain("carry all of this into the next hour");
    expect(result.body.toLowerCase()).not.toMatch(
      /emotional healing system|advanced nervous-system optimization|ai emotional regulation|therapy|spiritual|deep healing/,
    );
  });

  it("offers mental-exhaustion support without productivity or recovery-optimization framing", () => {
    const result = deriveCoachFallbackState({
      message: "My brain feels empty and mentally exhausted and I have no mental energy left.",
    });

    expect(result.title.toLowerCase()).toContain("recovery");
    expect(result.body.toLowerCase()).toContain("mentally recover all at once");
    expect(result.body.toLowerCase()).not.toMatch(
      /recover faster|mental performance|ai recovery optimization|maximize recovery|bounce back|productivity|therapy/,
    );
  });

  it("offers rebuilding support without motivational or comeback framing", () => {
    const result = deriveCoachFallbackState({
      message: "I am in survival mode and rebuilding after this long hard period feels slow.",
    });

    expect(result.title.toLowerCase()).toContain("gradual");
    expect(result.body.toLowerCase()).toContain("rebuild everything at once");
    expect(result.body.toLowerCase()).not.toMatch(
      /burnout recovery system|optimi[sz]e your comeback|ai resilience rebuilding|bounce back stronger|push through|high performance comeback|self-help|therapy/,
    );
  });

  it("offers setback-stability support without motivational or reassurance-heavy framing", () => {
    const result = deriveCoachFallbackState({
      message: "I am afraid I am going backwards and this setback means everything is getting worse.",
    });

    expect(result.title.toLowerCase()).toContain("smaller");
    expect(result.body.toLowerCase()).toContain("whole direction of your life");
    expect(result.body.toLowerCase()).not.toMatch(
      /master resilience|bounce back stronger|ai emotional recovery|growth mindset|therapy|self-help|everything happens for a reason/,
    );
  });

  it("offers self-forgiveness support without therapy or self-help framing", () => {
    const result = deriveCoachFallbackState({
      message: "I am being too hard on myself and feel guilty that I should be doing more.",
    });

    expect(result.title.toLowerCase()).toContain("harshness");
    expect(result.body.toLowerCase()).toContain("as harsh with yourself");
    expect(result.body.toLowerCase()).not.toMatch(
      /heal your inner self|transform your mindset|ai emotional healing|love yourself|therapy|self-help|inspirational|affirmations?/,
    );
  });

  it("offers calmer transition support without re-entry pressure", () => {
    const result = deriveCoachFallbackState({
      message: "Travel disrupted everything and I am returning after a stressful week.",
    });

    expect(result.title.toLowerCase()).toContain("transition");
    expect(result.body.toLowerCase()).not.toMatch(/welcome back|catch up|get back on track|missed/);
    expect(result.suggestions.join(" ").toLowerCase()).toContain("small");
  });

  it("offers calmer self-pressure support without therapy framing or dependency reassurance", () => {
    const result = deriveCoachFallbackState({
      message: "I feel like a failure and I am judging myself for not doing more.",
    });

    expect(result.title.toLowerCase()).toContain("pressure");
    expect(result.body.toLowerCase()).toContain("harsh story");
    expect(result.body.toLowerCase()).not.toMatch(/therapy|always here for you|healing|love yourself/);
  });

  it("offers setback-recovery support without re-engagement pressure", () => {
    const result = deriveCoachFallbackState({
      message: "I stopped check-ins, lost my routine, and feel discouraged about restarting.",
    });

    expect(result.title.toLowerCase()).toContain("restart");
    expect(result.body.toLowerCase()).not.toMatch(/welcome back|catch up|get back on track|discipline|motivation/);
    expect(result.suggestions.join(" ").toLowerCase()).toContain("small");
  });

  it("offers calmer future-planning support without productivity framing", () => {
    const result = deriveCoachFallbackState({
      message: "Planning next week feels overwhelming and I do not want to overcommit my schedule.",
    });

    expect(result.title.toLowerCase()).toContain("horizon");
    expect(result.body.toLowerCase()).not.toMatch(/master your schedule|productivity|optimize|high-performance/);
    expect(result.suggestions.join(" ").toLowerCase()).toContain("flexible");
  });
});
