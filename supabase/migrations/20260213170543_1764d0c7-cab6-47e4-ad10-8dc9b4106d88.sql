
-- Ensure resumes bucket exists and is private
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Users can upload own resume
CREATE POLICY "Users can upload own resume"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resumes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can read own resume
CREATE POLICY "Users can read own resume"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'resumes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Recruiters can read applicant resumes
CREATE POLICY "Recruiters can read applicant resumes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'resumes' AND
  EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.opportunities o ON a.opportunity_id = o.id
    WHERE o.recruiter_id = auth.uid()
    AND a.resume_url LIKE '%' || storage.objects.name || '%'
  )
);

-- Users can update own resume
CREATE POLICY "Users can update own resume"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'resumes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete own resume
CREATE POLICY "Users can delete own resume"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resumes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
