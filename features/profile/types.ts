export type Profile = {
  user_id: string;
  is_admin?: boolean;
  onboarding_completed: boolean;
  has_seen_app_tour: boolean;
  display_name: string | null;
  ms_type: string | null;
  year_diagnosed: string | null;
  symptoms: string[];
  goals: string[];
  country: string | null;
  age_range: string | null;
};
