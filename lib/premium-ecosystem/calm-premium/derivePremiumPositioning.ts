export type PremiumPlanPositioning = {
  title: string;
  subtitle: string;
  detail: string;
  badge?: string;
};

export type PremiumPositioning = {
  heroTitle: string;
  heroSubtitle: string;
  screenSubtitle: string;
  freeTierTitle: string;
  freeTierBody: string;
  primaryTitle: string;
  primaryLines: string[];
  primarySummary: string;
  secondaryTitle: string;
  secondaryLines: string[];
  tertiaryTitle: string;
  tertiaryBody: string;
  monthly: PremiumPlanPositioning;
  yearly: PremiumPlanPositioning;
  plansTitle: string;
  plansBody: string;
  trustTitle: string;
  trustLines: string[];
  inactiveProfileBody: string;
  activeProfileBody: string;
  profileNote: string;
  onboardingBody: string;
};

export function derivePremiumPositioning(): PremiumPositioning {
  return {
    heroTitle: "A calmer, deeper layer of support for difficult periods",
    heroSubtitle:
      "Premium is designed to make heavier days feel lighter to carry, with lower-friction support, gentler pacing, and steadier continuity over time.",
    screenSubtitle:
      "An optional upgrade for calmer support during difficult periods, while the core app stays free.",
    freeTierTitle: "What stays free",
    freeTierBody:
      "Daily check-ins, basic tracking, reminders, Programs, Care, and core insights all stay part of the free app.",
    primaryTitle: "What Premium is really for",
    primaryLines: [
      "Calmer support during difficult days",
      "Lower-friction support during heavier periods",
      "Support designed for lower-energy moments",
    ],
    primarySummary:
      "Premium is meant to reduce pressure, reduce overwhelm, and make the app feel quieter and steadier when life is already asking a lot.",
    secondaryTitle: "What becomes deeper with Premium",
    secondaryLines: [
      "Deeper grounding, pacing, and continuity tools",
      "Richer summaries with a calmer longer-view read",
      "Unlimited AI Coach in the same calm, bounded tone",
      "Adaptive support that simplifies more gently on harder days",
    ],
    tertiaryTitle: "A few practical extras",
    tertiaryBody:
      "Premium also includes additional exports, calmer customization, and longer-view summaries, but those are secondary to the overall support experience.",
    monthly: {
      title: "Monthly",
      subtitle: "A more flexible option if you want a lighter commitment.",
      detail: "An easier entry point if you want to see how Premium fits before deciding anything longer.",
    },
    yearly: {
      title: "Yearly",
      subtitle: "A steadier long-term option if you want calmer support to stay in place over time.",
      detail: "Simpler if you expect to lean on the app across changing weeks and would rather not think about it month to month.",
      badge: "Steadier over time",
    },
    plansTitle: "Choose the pace that fits",
    plansBody:
      "Monthly keeps things flexible. Yearly keeps the experience simpler and steadier over time.",
    trustTitle: "Billing and trust",
    trustLines: [
      "Billing is handled securely through Apple with localized App Store pricing.",
      "You can restore purchases anytime, and cancellation stays in your App Store settings.",
      "Your check-ins and wellness data stay yours. Premium changes access, not your control over the app.",
    ],
    inactiveProfileBody:
      "The free core experience stays intact. Premium adds calmer support during difficult periods if you ever want a little more steadiness later.",
    activeProfileBody:
      "Premium is active, including calmer support during difficult periods, and your plan is managed securely through Apple.",
    profileNote:
      "Premium is meant to feel supportive, steady, and optional rather than something you have to keep up with.",
    onboardingBody:
      "If you ever choose Premium later, it adds calmer support during difficult periods while your core tracking and daily app use stay free.",
  };
}
