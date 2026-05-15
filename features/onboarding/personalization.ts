import type { OnboardingDraft } from "./types";

export type OnboardingFocusKey = "stress-support" | "energy-support" | "care-organization" | "reflection-support";
export type OnboardingPriorityKey = "fatigue" | "stress" | "organization" | "reflection";

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
  body: string;
  symptomValue: string;
}> = [
  {
    key: "fatigue",
    title: "Fatigue feels hardest",
    body: "Lower-energy support and pacing may matter most right now.",
    symptomValue: "Fatigue",
  },
  {
    key: "stress",
    title: "Stress feels highest",
    body: "Short calming tools may help the day feel less loaded.",
    symptomValue: "Stress",
  },
  {
    key: "organization",
    title: "Keeping track feels hard",
    body: "A clearer place for care details can reduce mental load.",
    symptomValue: "Organization",
  },
  {
    key: "reflection",
    title: "I need space to process",
    body: "Gentle reflection can help name what this stretch has felt like.",
    symptomValue: "Reflection",
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
  const focuses = getSelectedOnboardingFocuses(draft);
  const priorities = getSelectedOnboardingPriorities(draft);
  const hasFocus = (key: OnboardingFocusKey) => focuses.includes(key);
  const hasPriority = (key: OnboardingPriorityKey) => priorities.includes(key);

  if ((hasPriority("fatigue") || hasFocus("energy-support")) && (hasPriority("stress") || hasFocus("stress-support"))) {
    return {
      title: "Start with steadier pacing",
      body: "Your first check-in can stay simple, then a calm reset or low-energy support tool can help the rest of the day feel more manageable.",
      nextPrimary: "Start with Today",
      nextSecondary: "Try a calm reset or low-energy checklist after your check-in",
    };
  }

  if (hasPriority("fatigue") || hasFocus("energy-support")) {
    return {
      title: "Start with a lighter first step",
      body: "Your first check-in can stay simple, then a low-energy support tool can help you protect the rest of the day.",
      nextPrimary: "Start with Today",
      nextSecondary: "Try the low-energy checklist after your check-in",
    };
  }

  if (hasPriority("stress") || hasFocus("stress-support")) {
    return {
      title: "Start with a steadier moment",
      body: "A short check-in and one calm reset can help the day feel more manageable without asking too much of you.",
      nextPrimary: "Start with Today",
      nextSecondary: "Try a calm reset if the day feels loaded",
    };
  }

  if ((hasPriority("organization") || hasFocus("care-organization")) && (hasPriority("reflection") || hasFocus("reflection-support"))) {
    return {
      title: "Start by getting things out of your head",
      body: "Your first check-in builds the picture, and then Care or a short reflection can help you hold the practical and emotional parts in one calmer place.",
      nextPrimary: "Start with Today",
      nextSecondary: "Use Care or a short reflection when you want more clarity",
    };
  }

  if (hasPriority("organization") || hasFocus("care-organization")) {
    return {
      title: "Start by making things easier to hold",
      body: "Your first check-in builds the picture, and Care can help keep appointments, medications, and notes in one place.",
      nextPrimary: "Start with Today",
      nextSecondary: "Use Care when you want everything in one place",
    };
  }

  if (hasPriority("reflection") || hasFocus("reflection-support")) {
    return {
      title: "Start with one honest check-in",
      body: "A short check-in can make reflection feel easier later, especially if you want a calmer way to process the week.",
      nextPrimary: "Start with Today",
      nextSecondary: "Try a short reflection after your check-in",
    };
  }

  return {
    title: "Start with one simple check-in",
    body: "A gentle first check-in is enough to help the app start feeling more useful right away.",
    nextPrimary: "Start with Today",
    nextSecondary: "Let the next step stay small",
  };
}
