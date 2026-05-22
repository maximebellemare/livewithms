import type { ProfileUpdateInput } from "../profile/api";

export type OnboardingStep =
  | "welcome"
  | "consent"
  | "profile-basics"
  | "ms-profile"
  | "symptoms"
  | "goals"
  | "about-you"
  | "plan"
  | "trust"
  | "reminders"
  | "complete";

export type OnboardingDraft = {
  display_name: string;
  ms_type: string;
  year_diagnosed: string;
  symptoms: string[];
  goals: string[];
  country: string;
  age_range: string;
  support_style: "short-simple" | "gentle-reflective" | "practical-structured" | "low-energy" | "";
  low_energy_mode: boolean;
  reminder_preference: "enable" | "skip";
};

export type ConsentState = {
  medical_disclaimer: boolean;
  health_data: boolean;
  not_medical: boolean;
  data_control: boolean;
};

export type SaveStepInput = {
  userId: string;
  input: ProfileUpdateInput;
};
