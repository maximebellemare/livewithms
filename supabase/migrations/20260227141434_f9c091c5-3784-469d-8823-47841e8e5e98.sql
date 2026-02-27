-- Create storage bucket for cached exercise illustrations
INSERT INTO storage.buckets (id, name, public) VALUES ('exercise-illustrations', 'exercise-illustrations', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read exercise illustrations (they're generic, not user-specific)
CREATE POLICY "Exercise illustrations are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'exercise-illustrations');

-- Only service role can upload (edge function uses service role)
CREATE POLICY "Service role can upload exercise illustrations"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'exercise-illustrations');