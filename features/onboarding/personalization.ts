import type { OnboardingDraft } from "./types";
import type { ComplexityTolerance, PreferredDensity, SupportStyle } from "../../lib/personalization/types";

export type OnboardingFocusKey = "stress-support" | "energy-support" | "care-organization" | "reflection-support";
export type OnboardingPriorityKey =
  | "fatigue"
  | "mood"
  | "stress"
  | "sleep"
  | "brain-fog"
  | "pain"
  | "mobility"
  | "care-organization"
  | "emotional-overwhelm"
  | "low-energy-days";
export type OnboardingSupportStyleKey = Exclude<OnboardingDraft["support_style"], "">;

type OnboardingSupportPreference = {
  supportStyle: SupportStyle;
  preferredDensity: PreferredDensity;
  complexityTolerance: ComplexityTolerance;
  lowEnergyMode: boolean;
};

export const ONBOARDING_FOCUS_OPTIONS: Array<{
  key: OnboardingFocusKey;
  title: string;
  body: string;
  goalValue: string;
}> = [
  {
    key: "stress-support",
    title: "Feel a little calmer",
    body: "Use short resets and steadier support on heavier days.",
    goalValue: "Stress Support",
  },
  {
    key: "energy-support",
    title: "Protect my energy",
    body: "Keep the day manageable when fatigue is high.",
    goalValue: "Energy Support",
  },
  {
    key: "care-organization",
    title: "Stay more organized",
    body: "Keep appointments, medications, and notes easier to track.",
    goalValue: "Care Organization",
  },
  {
    key: "reflection-support",
    title: "Understand how I’m doing",
    body: "Use reflection and patterns to make harder stretches feel clearer.",
    goalValue: "Reflection Support",
  },
];

export const ONBOARDING_PRIORITY_OPTIONS: Array<{
  key: OnboardingPriorityKey;
  title: string;
  body?: string;
  symptomValue: string;
}> = [
  {
    key: "fatigue",
    title: "Fatigue",
    symptomValue: "Fatigue",
  },
  {
    key: "mood",
    title: "Mood",
    symptomValue: "Mood",
  },
  {
    key: "stress",
    title: "Stress",
    symptomValue: "Stress",
  },
  {
    key: "sleep",
    title: "Sleep",
    symptomValue: "Sleep",
  },
  {
    key: "brain-fog",
    title: "Brain fog",
    symptomValue: "Brain Fog",
  },
  {
    key: "pain",
    title: "Pain",
    symptomValue: "Pain",
  },
  {
    key: "mobility",
    title: "Mobility",
    symptomValue: "Mobility",
  },
  {
    key: "care-organization",
    title: "Care organization",
    symptomValue: "Care Organization",
  },
  {
    key: "emotional-overwhelm",
    title: "Emotional overwhelm",
    symptomValue: "Emotional Overwhelm",
  },
  {
    key: "low-energy-days",
    title: "Low-energy days",
    symptomValue: "Low-Energy Days",
  },
];

export const ONBOARDING_SUPPORT_STYLE_OPTIONS: Array<{
  key: OnboardingSupportStyleKey;
  title: string;
  body: string;
}> = [
  {
    key: "short-simple",
    title: "Short and simple",
    body: "Keep things lighter, clearer, and easier to scan.",
  },
  {
    key: "gentle-reflective",
    title: "Gentle and reflective",
    body: "Leave a little more room for calm reflection.",
  },
  {
    key: "practical-structured",
    title: "Practical and structured",
    body: "Focus on steadier next steps without making things feel crowded.",
  },
  {
    key: "low-energy",
    title: "Low-energy mode",
    body: "Start with a simpler, lower-pressure version of the app.",
  },
];

function hasValue(values: string[], target: string) {
  return values.some((value) => value.toLowerCase() === target.toLowerCase());
}

function uniqueValues(values: string[]) {
  return values.filter((value, index) => values.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index);
}

export function getSelectedOnboardingFocuses(draft: OnboardingDraft): OnboardingFocusKey[] {
  return ONBOARDING_FOCUS_OPTIONS.filter((option) => hasValue(draft.goals, option.goalValue)).map((option) => option.key);
}

export function getSelectedOnboardingFocus(draft: OnboardingDraft): OnboardingFocusKey | null {
  return getSelectedOnboardingFocuses(draft)[0] ?? null;
}

export function getSelectedOnboardingPriorities(draft: OnboardingDraft): OnboardingPriorityKey[] {
  return ONBOARDING_PRIORITY_OPTIONS.filter((option) => hasValue(draft.symptoms, option.symptomValue)).map((option) => option.key);
}

export function getSelectedOnboardingPriority(draft: OnboardingDraft): OnboardingPriorityKey | null {
  return getSelectedOnboardingPriorities(draft)[0] ?? null;
}

export function deriveGoalsFromPriorities(symptoms: string[]) {
  const normalized = symptoms.map((symptom) => symptom.toLowerCase());
  const goals: string[] = [];

  if (
    normalized.includes("fatigue") ||
    normalized.includes("sleep") ||
    normalized.includes("low-energy days")
  ) {
    goals.push("Energy Support");
  }

  if (
    normalized.includes("stress") ||
    normalized.includes("mood") ||
    normalized.includes("emotional overwhelm")
  ) {
    goals.push("Stress Support");
  }

  if (
    normalized.includes("care organization") ||
    normalized.includes("brain fog")
  ) {
    goals.push("Care Organization");
  }

  if (
    normalized.includes("pain") ||
    normalized.includes("mobility")
  ) {
    goals.push("Reflection Support");
  }

  return uniqueValues(goals);
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
        supportStyle: "reflective",
        preferredDensity: "reflective",
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

export function toggleOnboardingFocus(draft: OnboardingDraft, key: OnboardingFocusKey): OnboardingDraft {
  const selected = ONBOARDING_FOCUS_OPTIONS.find((option) => option.key === key);
  if (!selected) {
    return draft;
  }

  const isSelected = hasValue(draft.goals, selected.goalValue);
  const nextGoals = isSelected
    ? draft.goals.filter((goal) => goal.toLowerCase() !== selected.goalValue.toLowerCase())
    : [...draft.goals, selected.goalValue];

  return {
    ...draft,
    goals: uniqueValues(nextGoals),
  };
}

export function toggleOnboardingPriority(draft: OnboardingDraft, key: OnboardingPriorityKey): OnboardingDraft {
  const selected = ONBOARDING_PRIORITY_OPTIONS.find((option) => option.key === key);
  if (!selected) {
    return draft;
  }

  const isSelected = hasValue(draft.symptoms, selected.symptomValue);
  const nextSymptoms = isSelected
    ? draft.symptoms.filter((symptom) => symptom.toLowerCase() !== selected.symptomValue.toLowerCase())
    : [...draft.symptoms, selected.symptomValue];

  return {
    ...draft,
    symptoms: uniqueValues(nextSymptoms),
  };
}

export function getPersonalizedOnboardingGuidance(draft: OnboardingDraft) {
  const priorities = getSelectedOnboardingPriorities(draft);
  const supportStyle = getSelectedOnboardingSupportStyle(draft);
  const hasPriority = (key: OnboardingPriorityKey) => priorities.includes(key);

  if (supportStyle === "low-energy" || hasPriority("low-energy-days")) {
    return {
      title: "Start with a lighter version of today",
      body: "Your first check-in can stay small. From there, the app can keep things calmer and easier to scan on heavier days.",
      nextPrimary: "Start with Today",
      nextSecondary: "Let the first step stay small",
    };
  }

  if (hasPriority("fatigue") || hasPriority("sleep") || hasPriority("brain-fog")) {
    return {
      title: "Start with steadier pacing",
      body: "A simple check-in is enough to begin. You do not need to track everything to make the app useful.",
      nextPrimary: "Start with Today",
      nextSecondary: "Keep the next step simple if energy is limited",
    };
  }

  if (hasPriority("stress") || hasPriority("mood") || hasPriority("emotional-overwhelm")) {
    return {
      title: "Start with a steadier moment",
      body: "A short check-in can make difficult days feel a little less crowded without turning this into more work.",
      nextPrimary: "Start with Today",
      nextSecondary: "Notice what today feels like without pressure to explain everything",
    };
  }

  if (hasPriority("care-organization")) {
    return {
      title: "Start by making life easier to hold",
      body: "A check-in can help the app become more useful, and Care can keep important details in one calmer place when you need them.",
      nextPrimary: "Start with Today",
      nextSecondary: "Use Care when you want one quieter place for details",
    };
  }

  if (supportStyle === "gentle-reflective") {
    return {
      title: "Start with one honest check-in",
      body: "A simple check-in now can make reflection feel gentler later, without asking you to process everything at once.",
      nextPrimary: "Start with Today",
      nextSecondary: "Let reflection stay light for now",
    };
  }

  return {
    title: "Start with one simple check-in",
    body: "A gentle first check-in is enough to help the app begin building patterns without making the day feel heavier.",
    nextPrimary: "Start with Today",
    nextSecondary: "Let the next step stay small",
  };
}
