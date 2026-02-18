-- Create a storage bucket for PDF reports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('reports', 'reports', true, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own reports
CREATE POLICY "Users can upload their own reports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access (so Klaviyo email link works without auth)
CREATE POLICY "Reports are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'reports');

-- Allow users to delete their own reports
CREATE POLICY "Users can delete their own reports"
ON storage.objects FOR DELETE
USING (bucket_id = 'reports' AND auth.uid()::text = (storage.foldername(name))[1]);