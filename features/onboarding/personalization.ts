import type { OnboardingDraft } from "./types";
import type { ComplexityTolerance, PreferredDensity, SupportStyle } from "../../lib/personalization/types";

export type OnboardingFocusKey =
  | "energy-support"
  | "stress-support"
  | "brain-fog-support"
  | "care-organization"
  | "recovery-support";
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
    key: "energy-support",
    title: "Energy support",
    body: "Track fatigue and use pacing tools on lower-energy days.",
    goalValue: "Energy Support",
  },
  {
    key: "stress-support",
    title: "Stress support",
    body: "Use practical tools for overwhelm, planning, and difficult days.",
    goalValue: "Stress Support",
  },
  {
    key: "brain-fog-support",
    title: "Brain fog support",
    body: "Use cognitive tools and short exercises when thinking feels harder.",
    goalValue: "Brain Fog Support",
  },
  {
    key: "care-organization",
    title: "Care organization",
    body: "Keep medications, appointments, notes, and summaries in one place.",
    goalValue: "Care Organization",
  },
  {
    key: "recovery-support",
    title: "Recovery support",
    body: "Notice what helps recovery and keep difficult days simpler.",
    goalValue: "Recovery Support",
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
    key: "low-energy-days",
    title: "Recovery support",
    symptomValue: "Low-Energy Days",
  },
  {
    key: "emotional-overwhelm",
    title: "Emotional overwhelm",
    symptomValue: "Emotional Overwhelm",
  },
];

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

  if (normalized.includes("brain fog")) {
    goals.push("Brain Fog Support");
  }

  if (
    normalized.includes("pain") ||
    normalized.includes("mobility") ||
    normalized.includes("low-energy days")
  ) {
    goals.push("Recovery Support");
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
      body: "Your first check-in can stay short. Low Energy Mode can simplify the app on heavier days.",
      nextPrimary: "Start with Today",
      nextSecondary: "Start with a short check-in",
    };
  }

  if (hasPriority("fatigue") || hasPriority("sleep") || hasPriority("brain-fog")) {
    return {
      title: "Start with steadier pacing",
      body: "A simple check-in is enough to begin. You do not need to track everything at once.",
      nextPrimary: "Start with Today",
      nextSecondary: "Keep the next step simple if energy is limited",
    };
  }

  if (hasPriority("stress") || hasPriority("mood") || hasPriority("emotional-overwhelm")) {
    return {
      title: "Start with a steadier moment",
      body: "A short check-in can help sort out what today feels like without adding much work.",
      nextPrimary: "Start with Today",
      nextSecondary: "Note what stands out today",
    };
  }

  if (hasPriority("care-organization")) {
    return {
      title: "Start with one place for care details",
      body: "Care keeps medications, appointments, notes, and summaries easier to find.",
      nextPrimary: "Start with Today",
      nextSecondary: "Use Care when you want one place for details",
    };
  }

  if (supportStyle === "gentle-reflective") {
    return {
      title: "Start with one useful check-in",
      body: "A simple check-in gives Insights and support tools better context over time.",
      nextPrimary: "Start with Today",
      nextSecondary: "Keep the first check-in brief",
    };
  }

  return {
    title: "Start with one simple check-in",
    body: "A first check-in is enough to help the app begin building patterns.",
    nextPrimary: "Start with Today",
    nextSecondary: "Start with one short check-in",
  };
}
