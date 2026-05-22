export type CategoryDefiningPositioning = {
  appStoreDescription: string;
  appStoreSubtitle: string;
  onboardingSubtitle: string;
  onboardingPrivacyLine: string;
  onboardingCompletionLine: string;
  termsSubtitle: string;
  identitySummary: string;
  differentiators: string[];
};

export function deriveCategoryDefiningPositioning(): CategoryDefiningPositioning {
  return {
    appStoreDescription:
      "LiveWithMS is a calm, emotionally safe support environment for people living with MS. It is designed to reduce overwhelm, support steadiness, and make difficult periods feel lighter and more manageable through low-pressure check-ins, gentle reflection, calmer programs, and low-energy-friendly design.",
    appStoreSubtitle:
      "Calm support for difficult days, lower-energy periods, and steadier routines with MS.",
    onboardingSubtitle:
      "A calmer support environment for noticing patterns, reducing overwhelm, and getting through difficult days with less pressure.",
    onboardingPrivacyLine:
      "A few optional details help the app stay calmer, lighter, and more relevant without asking you to track more than feels useful.",
    onboardingCompletionLine:
      "The first few check-ins help the app become steadier and easier to use over time, without turning it into a high-pressure tracking system.",
    termsSubtitle:
      "Use LiveWithMS as a calm support tool for living with MS, not a substitute for medical care.",
    identitySummary:
      "A calm, emotionally safe support environment designed to reduce overwhelm, support steadiness, and make difficult periods feel lighter and more manageable.",
    differentiators: [
      "Calm, low-pressure support instead of productivity or wellness-performance culture",
      "Low-energy accessibility and adaptive simplification during difficult periods",
      "Emotionally restrained AI support without companion dynamics or therapy simulation",
      "Long-term continuity and steadiness without streak pressure or engagement manipulation",
    ],
  };
}
