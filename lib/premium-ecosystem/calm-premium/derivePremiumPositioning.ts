export type PremiumPlanPositioning = {
  title: string;
  subtitle: string;
  detail: string;
  badge?: string;
};

export type PremiumPositioning = {
  heroTitle: string;
  heroSubtitle: string;
  heroBody: string;
  screenSubtitle: string;
  freeTierTitle: string;
  freeTierBody: string;
  primaryTitle: string;
  primaryLines: string[];
  primarySummary: string;
  secondaryTitle: string;
  secondaryLines: string[];
  secondarySummary: string;
  tertiaryTitle: string;
  tertiaryBody: string;
  softValueTitle: string;
  softValueBody: string;
  softValueLines: string[];
  supportPrinciplesTitle: string;
  supportPrinciplesLines: string[];
  monthly: PremiumPlanPositioning;
  yearly: PremiumPlanPositioning;
  plansTitle: string;
  plansBody: string;
  trustTitle: string;
  trustLines: string[];
  purchaseCta: string;
  purchaseLoadingLabel: string;
  purchaseUnavailableLabel: string;
  secondaryCtaLabel: string;
  doneCtaLabel: string;
  retryLabel: string;
  loadingPricingTitle: string;
  loadingPricingBody: string;
  errorPricingTitle: string;
  errorPricingBody: string;
  expoGoPricingNote: string;
  activeTitle: string;
  activeRefreshLabel: string;
  purchaseSuccessTitle: string;
  purchaseSuccessBody: string;
  purchasePendingTitle: string;
  restoreTitle: string;
  restoreButtonLabel: string;
  restoreSuccessTitle: string;
  restoreSuccessBody: string;
  restorePendingTitle: string;
  inactiveProfileBody: string;
  activeProfileBody: string;
  profileNote: string;
  onboardingBody: string;
};

export function derivePremiumPositioning(): PremiumPositioning {
  return {
    heroTitle: "Deeper support for the days that ask more of you",
    heroSubtitle:
      "Premium adds a calmer layer of guidance, continuity, and low-energy support when life already feels heavy enough.",
    heroBody:
      "It is designed to reduce mental load, add steadier structure, and make the app feel a little easier to lean on during difficult periods.",
    screenSubtitle:
      "An optional layer of calmer support, while the core app stays free and fully usable.",
    freeTierTitle: "What stays free",
    freeTierBody:
      "Daily check-ins, core tracking, reminders, Programs, Care, and your essential insights stay part of the free app.",
    primaryTitle: "More personalized support",
    primaryLines: [
      "Guidance that reflects your patterns in a calmer, more personal way",
      "Gentler daily structure when things already feel like a lot",
      "Steadier continuity across difficult stretches, not just isolated moments",
    ],
    primarySummary:
      "Premium is meant to lower mental load, soften overwhelm, and make support feel steadier without asking you to do more.",
    secondaryTitle: "Tools for low-energy days",
    secondaryLines: [
      "Easier navigation and calmer pacing when energy is limited",
      "Deeper summaries that help you notice patterns without digging through everything yourself",
      "Supportive reflections and guidance that stay calm, bounded, and practical",
      "Adaptive support that simplifies more gently on harder days",
    ],
    secondarySummary:
      "The goal is not to add more features to keep up with. It is to make the support you already want feel easier to reach.",
    tertiaryTitle: "Deeper insight into your patterns",
    tertiaryBody:
      "Premium also adds richer reflections, longer-view summaries, and calmer exports so patterns feel clearer over time with less effort from you.",
    softValueTitle: "Why Premium exists",
    softValueBody:
      "Premium helps sustain the calmer parts of LiveWithMS: adaptive guidance, deeper insight systems, emotional support tools, and accessibility-focused improvements.",
    softValueLines: [
      "Supportive, not overwhelming",
      "Designed for real-life energy limitations",
      "Built to stay calm as the app keeps improving",
    ],
    supportPrinciplesTitle: "What stays true with Premium",
    supportPrinciplesLines: [
      "Move at your own pace.",
      "No streaks. No pressure.",
      "Use only what helps.",
      "Designed for real-life energy limitations.",
      "Supportive, not overwhelming.",
    ],
    monthly: {
      title: "Monthly plan",
      subtitle: "More flexible if you want to keep things month to month.",
      detail: "A simpler starting point if you want to see how Premium fits without thinking too far ahead.",
    },
    yearly: {
      title: "Yearly plan",
      subtitle: "Simpler if you would rather keep support in place across the year.",
      detail: "Usually a little lighter month to month overall, with less to think about as the year moves along.",
      badge: "Simpler over time",
    },
    plansTitle: "Choose the pace that fits",
    plansBody:
      "Monthly keeps things flexible. Yearly keeps support in place more simply and steadily over time.",
    trustTitle: "Billing and trust",
    trustLines: [
      "Billing is handled securely through Apple with localized App Store pricing.",
      "You can restore purchases anytime, and manage or cancel in your App Store settings.",
      "Your check-ins and personal data stay yours. Premium changes access, not your control over the app.",
    ],
    purchaseCta: "Continue with Premium",
    purchaseLoadingLabel: "Preparing Premium...",
    purchaseUnavailableLabel: "Premium details are still loading",
    secondaryCtaLabel: "Not now",
    doneCtaLabel: "Done",
    retryLabel: "Try again",
    loadingPricingTitle: "Bringing in current pricing",
    loadingPricingBody:
      "This can take a moment while the App Store refreshes quietly in the background.",
    errorPricingTitle: "Premium details are taking a moment",
    errorPricingBody:
      "If pricing is still settling in, try again later. The rest of the app still works normally in the meantime.",
    expoGoPricingNote:
      "Purchases are unavailable in Expo Go. Use a development build or TestFlight to test subscriptions.",
    activeTitle: "Premium is active",
    activeRefreshLabel: "Refresh Premium status",
    purchaseSuccessTitle: "Premium is ready",
    purchaseSuccessBody: "Your additional support is now available.",
    purchasePendingTitle: "Purchase needs a moment",
    restoreTitle: "Restore and billing",
    restoreButtonLabel: "Restore purchases",
    restoreSuccessTitle: "Premium access is back in place",
    restoreSuccessBody: "Your Premium access has been refreshed.",
    restorePendingTitle: "Restore needs a moment",
    inactiveProfileBody:
      "The free core experience stays intact. Premium adds deeper support, steadier continuity, and calmer low-energy help if you ever want more of that later.",
    activeProfileBody:
      "Premium is active, including deeper support for difficult periods, and your plan is managed securely through Apple.",
    profileNote:
      "Premium is meant to feel supportive, steady, and optional, not like something you have to keep up with.",
    onboardingBody:
      "If you ever choose Premium later, it adds deeper support, calmer summaries, and more low-energy help while your core tracking stays free.",
  };
}
