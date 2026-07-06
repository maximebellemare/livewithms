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

export const ONBOARDING_CHALLENGE_OPTIONS = [
  "Fatigue",
  "Brain fog",
  "Pain",
  "Sleep",
  "Heat sensitivity",
  "Mood",
  "Nutrition",
  "Staying consistent",
  "Preparing for doctor visits",
] as const;

export const ONBOARDING_TRACKING_OPTIONS = [
  "Fatigue",
  "Pain",
  "Numbness / tingling",
  "Vision issues",
  "Brain fog",
  "Mood",
  "Sleep",
  "Mobility",
  "Bladder issues",
  "Water / hydration",
  "Food / nutrition",
] as const;

export const ONBOARDING_HELP_FIRST_OPTIONS = [
  "Spotting symptom patterns",
  "Getting better insights",
  "Talking to the AI Coach",
  "Planning meals",
  "Building healthy habits",
  "Managing energy",
  "Brain games for focus and memory",
  "Finding community support",
  "Preparing for doctor visits",
] as const;

export const ONBOARDING_MOTIVATION_OPTIONS = [
  {
    key: "just-getting-started",
    title: "Just getting started",
    body: "I want something simple and manageable this week.",
  },
  {
    key: "somewhat-motivated",
    title: "Somewhat motivated",
    body: "I can check in most days if it stays practical.",
  },
  {
    key: "very-motivated",
    title: "Very motivated",
    body: "I’m ready to track consistently and learn from it.",
  },
] as const;

export const ONBOARDING_FEATURE_HIGHLIGHTS = [
  {
    id: "today-plan",
    title: "Today’s Plan",
    body: "Keep today realistic with a smaller plan, recovery support, and tomorrow prep.",
  },
  {
    id: "symptom-tracking",
    title: "Symptom tracking",
    body: "Log fatigue, mood, sleep, hydration, and body signals in one calm check-in.",
  },
  {
    id: "insights",
    title: "Insights",
    body: "See patterns that may be worth watching and useful to discuss with your clinician.",
  },
  {
    id: "coach",
    title: "AI Coach",
    body: "Talk through fatigue, brain fog, planning, and difficult stretches with structured support.",
  },
  {
    id: "nutrition",
    title: "Nutrition planner",
    body: "Build simple meal plans, food swaps, and grocery lists around real energy levels.",
  },
  {
    id: "food-check",
    title: "Is this inflammatory?",
    body: "Quickly check foods with cautious guidance that can help you stay organized.",
  },
  {
    id: "brain-games",
    title: "Brain games",
    body: "Use short focus and memory exercises without pressure or leaderboard noise.",
  },
  {
    id: "community",
    title: "Community",
    body: "Learn from other people living with MS through practical, structured discussions.",
  },
  {
    id: "doctor-prep",
    title: "Doctor visit preparation",
    body: "Bring symptoms, questions, and notes together so appointments feel easier to prepare for.",
  },
] as const;

export const MS_TYPES = [
  { label: "RRMS", value: "RRMS" },
  { label: "PPMS", value: "PPMS" },
  { label: "SPMS", value: "SPMS" },
  { label: "CIS", value: "CIS" },
  { label: "Unknown", value: "Unknown" },
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
