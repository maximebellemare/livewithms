import {
  ONBOARDING_CHALLENGE_OPTIONS,
  ONBOARDING_HELP_FIRST_OPTIONS,
  ONBOARDING_MOTIVATION_OPTIONS,
  ONBOARDING_TRACKING_OPTIONS,
} from "./constants";
import type { OnboardingDraft } from "./types";
import type { ComplexityTolerance, PreferredDensity, SupportStyle } from "../../lib/personalization/types";

export type OnboardingSupportStyleKey = Exclude<OnboardingDraft["support_style"], "">;

type OnboardingSupportPreference = {
  supportStyle: SupportStyle;
  preferredDensity: PreferredDensity;
  complexityTolerance: ComplexityTolerance;
  lowEnergyMode: boolean;
};

export const ONBOARDING_SUPPORT_STYLE_OPTIONS: Array<{
  key: OnboardingSupportStyleKey;
  title: string;
  body: string;
}> = [
  {
    key: "short-simple",
    title: "Standard layout",
    body: "Use the regular app layout and all available sections.",
  },
  {
    key: "low-energy",
    title: "Low-energy mode",
    body: "Start with fewer prompts, simpler screens, and reduced suggestions.",
  },
];

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function uniqueValues(values: string[]) {
  const seen = new Set<string>();
  const next: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }

    const normalized = normalizeText(trimmed);
    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    next.push(trimmed);
  }

  return next;
}

function splitCustomValues(value: string) {
  return uniqueValues(
    value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function isKnownOption(value: string, options: readonly string[]) {
  const normalized = normalizeText(value);
  return options.some((option) => normalizeText(option) === normalized);
}

export function buildOnboardingSymptoms(draft: OnboardingDraft) {
  return uniqueValues([
    ...draft.hardest_challenges,
    ...draft.tracking_focuses,
    ...splitCustomValues(draft.hardest_challenges_custom),
    ...splitCustomValues(draft.tracking_focuses_custom),
  ]).slice(0, 12);
}

export function buildOnboardingGoals(draft: OnboardingDraft) {
  return uniqueValues(draft.help_first).slice(0, 9);
}

export function getSelectedOnboardingFocuses(draft: OnboardingDraft) {
  return uniqueValues(draft.help_first);
}

export function getSelectedOnboardingFocus(draft: OnboardingDraft) {
  return getSelectedOnboardingFocuses(draft)[0] ?? null;
}

export function getSelectedOnboardingPriorities(draft: OnboardingDraft) {
  return uniqueValues(draft.hardest_challenges);
}

export function getSelectedOnboardingPriority(draft: OnboardingDraft) {
  return getSelectedOnboardingPriorities(draft)[0] ?? null;
}

export function getSelectedOnboardingSupportStyle(draft: OnboardingDraft) {
  return draft.support_style || "short-simple";
}

export function deriveOnboardingSupportPreference(
  choice: OnboardingDraft["support_style"],
): OnboardingSupportPreference {
  switch (choice) {
    case "short-simple":
      return {
        supportStyle: "steady",
        preferredDensity: "minimal",
        complexityTolerance: "lower",
        lowEnergyMode: false,
      };
    case "gentle-reflective":
      return {
        supportStyle: "steady",
        preferredDensity: "standard",
        complexityTolerance: "balanced",
        lowEnergyMode: false,
      };
    case "practical-structured":
      return {
        supportStyle: "practical",
        preferredDensity: "standard",
        complexityTolerance: "balanced",
        lowEnergyMode: false,
      };
    case "low-energy":
    default:
      return {
        supportStyle: "calm",
        preferredDensity: "minimal",
        complexityTolerance: "lower",
        lowEnergyMode: true,
      };
  }
}

export function mapStoredSupportStyleToOnboardingChoice(input: {
  supportStyle?: SupportStyle | null;
  lowEnergyMode?: boolean;
}): OnboardingDraft["support_style"] {
  if (input.lowEnergyMode || input.supportStyle === "calm") {
    return "low-energy";
  }

  if (input.supportStyle === "reflective") {
    return "gentle-reflective";
  }

  if (input.supportStyle === "practical") {
    return "practical-structured";
  }

  return "short-simple";
}

export function hydrateChallengesFromSymptoms(symptoms: string[]) {
  const known = uniqueValues(
    symptoms.filter((value) => isKnownOption(value, ONBOARDING_CHALLENGE_OPTIONS)),
  );
  const custom = uniqueValues(
    symptoms.filter((value) => !isKnownOption(value, ONBOARDING_CHALLENGE_OPTIONS) && !isKnownOption(value, ONBOARDING_TRACKING_OPTIONS)),
  );

  return {
    selected: known,
    customText: custom.join(", "),
  };
}

export function hydrateTrackingFromSymptoms(symptoms: string[]) {
  const known = uniqueValues(
    symptoms.filter((value) => isKnownOption(value, ONBOARDING_TRACKING_OPTIONS)),
  );
  const custom = uniqueValues(
    symptoms.filter((value) => !isKnownOption(value, ONBOARDING_CHALLENGE_OPTIONS) && !isKnownOption(value, ONBOARDING_TRACKING_OPTIONS)),
  );

  return {
    selected: known,
    customText: custom.join(", "),
  };
}

export function hydrateHelpFirstFromGoals(goals: string[]) {
  return uniqueValues(
    goals.filter((value) => isKnownOption(value, ONBOARDING_HELP_FIRST_OPTIONS)),
  );
}

export function getMotivationCopy(level: OnboardingDraft["motivation_level"]) {
  return ONBOARDING_MOTIVATION_OPTIONS.find((option) => option.key === level) ?? null;
}

export function getPersonalizedOnboardingGuidance(draft: OnboardingDraft) {
  const hardest = uniqueValues(draft.hardest_challenges).slice(0, 2);
  const tracking = uniqueValues(draft.tracking_focuses).slice(0, 2);
  const helpFirst = uniqueValues(draft.help_first).slice(0, 3);
  const motivation = getMotivationCopy(draft.motivation_level);

  const focusLine =
    hardest.length > 0
      ? `You’re starting with extra support around ${hardest.join(" and ").toLowerCase()}.`
      : "You’re starting with calmer day-to-day support and clearer symptom tracking.";
  const trackingLine =
    tracking.length > 0
      ? `Tracking will focus first on ${tracking.join(", ").toLowerCase()}.`
      : "Tracking can stay simple while you learn what is most useful to log.";
  const helpLine =
    helpFirst.length > 0
      ? `LiveWithMS will help first with ${helpFirst.join(", ").toLowerCase()}.`
      : "LiveWithMS can help you notice patterns, organize information, and plan around difficult days.";
  const motivationLine = motivation
    ? motivation.body
    : "You can start small and still build useful context over time.";

  return {
    title: "Based on your answers, LiveWithMS will help you focus on…",
    body: focusLine,
    points: [trackingLine, helpLine, motivationLine],
    nextPrimary: "Start with Today",
    nextSecondary: "A short check-in is enough to begin building useful context",
  };
}
