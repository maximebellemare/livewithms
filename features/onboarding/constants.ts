import type { ConsentState, OnboardingStep } from "./types";
import { APP_CONFIG } from "../../lib/app-config";

export const ONBOARDING_STEPS: OnboardingStep[] = [...APP_CONFIG.onboarding.steps] as OnboardingStep[];

export const CONSENT_ITEMS: Array<{
  id: keyof ConsentState;
  label: string;
  required: boolean;
}> = [
  {
    id: "medical_disclaimer",
    label: "I understand this app does not replace professional medical advice.",
    required: true,
  },
  {
    id: "health_data",
    label: "I understand my health data will be stored securely.",
    required: true,
  },
  {
    id: "not_medical",
    label: "I understand tracking and insights are informational only.",
    required: true,
  },
  {
    id: "data_control",
    label: "I understand I remain in control of my data.",
    required: true,
  },
];

export const MS_TYPES = [
  { label: "RRMS", value: "RRMS" },
  { label: "PPMS", value: "PPMS" },
  { label: "SPMS", value: "SPMS" },
  { label: "CIS", value: "CIS" },
  { label: "Unknown", value: "Unknown" },
];

export const COMMON_SYMPTOMS = [
  { label: "Fatigue", value: "Fatigue" },
  { label: "Pain", value: "Pain" },
  { label: "Brain Fog", value: "Brain Fog" },
  { label: "Numbness", value: "Numbness" },
  { label: "Vision Issues", value: "Vision Issues" },
  { label: "Spasticity", value: "Spasticity" },
  { label: "Balance", value: "Balance" },
  { label: "Bladder", value: "Bladder" },
];

export const GOALS = [
  { label: "Better Sleep", value: "Better Sleep" },
  { label: "More Energy", value: "More Energy" },
  { label: "Less Pain", value: "Less Pain" },
  { label: "Improved Mood", value: "Improved Mood" },
  { label: "Better Mobility", value: "Better Mobility" },
  { label: "Sharper Thinking", value: "Sharper Thinking" },
];

export const COUNTRIES = [
  { label: "United States", value: "United States" },
  { label: "Canada", value: "Canada" },
  { label: "United Kingdom", value: "United Kingdom" },
  { label: "Australia", value: "Australia" },
  { label: "Other", value: "Other" },
];

export const AGE_RANGES = [
  { label: "18–24", value: "18–24" },
  { label: "25–34", value: "25–34" },
  { label: "35–44", value: "35–44" },
  { label: "45–54", value: "45–54" },
  { label: "55–64", value: "55–64" },
  { label: "65+", value: "65+" },
];
