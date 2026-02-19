
CREATE TABLE public.report_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  start_date date NOT NULL,
  end_date date NOT NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  file_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.report_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own report history"
  ON public.report_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own report history"
  ON public.report_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own report history"
  ON public.report_history FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_report_history_user_id ON public.report_history(user_id);
CREATE INDEX idx_report_history_sent_at ON public.report_history(sent_at DESC);
