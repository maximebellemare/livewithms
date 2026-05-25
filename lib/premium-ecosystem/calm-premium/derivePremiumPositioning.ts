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
    heroTitle: "Additional support for difficult days",
    heroSubtitle:
      "Premium adds deeper guidance, clearer summaries, and low-energy tools.",
    heroBody:
      "It is designed to reduce mental load and make the app easier to use when energy is limited.",
    screenSubtitle:
      "Optional additional support. The core app stays free and fully usable.",
    freeTierTitle: "What stays free",
    freeTierBody:
      "Daily check-ins, core tracking, reminders, Programs, Care, and your essential insights stay part of the free app.",
    primaryTitle: "More personalized support",
    primaryLines: [
      "Guidance that reflects your patterns more directly",
      "Daily structure that is easier to follow on difficult days",
      "Longer-term support across difficult stretches",
    ],
    primarySummary:
      "Premium is designed to reduce mental load and make support easier to use without adding more work.",
    secondaryTitle: "Tools for low-energy days",
    secondaryLines: [
      "Easier navigation when energy is limited",
      "Deeper summaries that help you notice patterns without digging through everything yourself",
      "Reflections and guidance that stay practical and bounded",
      "Adaptive support that simplifies on harder days",
    ],
    secondarySummary:
      "The goal is to make useful support easier to reach.",
    tertiaryTitle: "Deeper insight into your patterns",
    tertiaryBody:
      "Premium also adds richer reflections, longer-term summaries, and exports so patterns are easier to review.",
    softValueTitle: "Why Premium exists",
    softValueBody:
      "Premium helps support deeper guidance, insight tools, and accessibility improvements in LiveWithMS.",
    softValueLines: [
      "Lower cognitive load",
      "Designed for real-life energy limitations",
      "Built to stay clear as the app grows",
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
      subtitle: "Flexible month-to-month support.",
      detail: "A simpler option if you want to keep support on a monthly renewal.",
    },
    yearly: {
      title: "Yearly plan",
      subtitle: "Lower overall yearly cost with fewer renewals.",
      detail: "A simpler long-term option for ongoing support across the year.",
      badge: "Simpler over time",
    },
    plansTitle: "Choose the pace that fits",
    plansBody:
      "Monthly keeps support flexible. Yearly lowers the overall yearly cost and reduces renewal frequency.",
    trustTitle: "Billing and trust",
    trustLines: [
      "Billing is handled securely through Apple with localized App Store pricing.",
      "You can restore purchases anytime, and manage or cancel in your App Store settings.",
      "Your check-ins and personal data stay yours.",
    ],
    purchaseCta: "Continue with Premium",
    purchaseLoadingLabel: "Preparing Premium...",
    purchaseUnavailableLabel: "Premium details are still loading",
    secondaryCtaLabel: "Not now",
    doneCtaLabel: "Done",
    retryLabel: "Try again",
    loadingPricingTitle: "Bringing in current pricing",
    loadingPricingBody:
      "This can take a moment while the App Store refreshes pricing.",
    errorPricingTitle: "Premium details are taking a moment",
    errorPricingBody:
      "If pricing is still loading, try again later. The rest of the app still works normally.",
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
      "The free core experience stays intact. Premium adds deeper support, longer-term summaries, and more low-energy help.",
    activeProfileBody:
      "Premium is active, and your plan is managed securely through Apple.",
    profileNote:
      "Premium is optional and meant to reduce friction.",
    onboardingBody:
      "If you choose Premium later, it adds deeper support, clearer summaries, and more low-energy help while core tracking stays free.",
  };
}
