-- Exercise Logs
CREATE TABLE public.exercise_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  type text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  intensity text NOT NULL DEFAULT 'moderate',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own exercise logs" ON public.exercise_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own exercise logs" ON public.exercise_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exercise logs" ON public.exercise_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exercise logs" ON public.exercise_logs FOR DELETE USING (auth.uid() = user_id);

-- Supplement Logs
CREATE TABLE public.supplement_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  name text NOT NULL,
  taken boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.supplement_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own supplement logs" ON public.supplement_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own supplement logs" ON public.supplement_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own supplement logs" ON public.supplement_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own supplement logs" ON public.supplement_logs FOR DELETE USING (auth.uid() = user_id);

-- Diet Goals
CREATE TABLE public.diet_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  target text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.diet_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own diet goals" ON public.diet_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own diet goals" ON public.diet_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own diet goals" ON public.diet_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own diet goals" ON public.diet_goals FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_diet_goals_updated_at BEFORE UPDATE ON public.diet_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Diet Goal Logs (daily check-in per goal)
CREATE TABLE public.diet_goal_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  goal_id uuid NOT NULL REFERENCES public.diet_goals(id) ON DELETE CASCADE,
  date date NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(goal_id, date)
);
ALTER TABLE public.diet_goal_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own diet goal logs" ON public.diet_goal_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own diet goal logs" ON public.diet_goal_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own diet goal logs" ON public.diet_goal_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own diet goal logs" ON public.diet_goal_logs FOR DELETE USING (auth.uid() = user_id);

-- Weight Logs
CREATE TABLE public.weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  weight numeric NOT NULL,
  unit text NOT NULL DEFAULT 'kg',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own weight logs" ON public.weight_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own weight logs" ON public.weight_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own weight logs" ON public.weight_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own weight logs" ON public.weight_logs FOR DELETE USING (auth.uid() = user_id);