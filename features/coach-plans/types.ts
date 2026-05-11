export type CoachPlan = {
  id: string;
  user_id: string;
  date: string;
  priority: string | null;
  avoid: string | null;
  support_action: string | null;
  created_at: string;
  updated_at: string;
};

export type CoachPlanInput = {
  priority: string | null;
  avoid: string | null;
  support_action: string | null;
};
