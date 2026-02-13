
-- Fix 1: Remove permissive notification INSERT policy
-- Notifications should only be created by edge functions using service role key (bypasses RLS)
DROP POLICY IF EXISTS "Authenticated users can receive notifications" ON public.notifications;

-- Fix 2: Replace LIKE-based resume policy with exact folder matching
DROP POLICY IF EXISTS "Recruiters can read applicant resumes" ON storage.objects;

CREATE POLICY "Recruiters can read applicant resumes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'resumes' AND
  EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.opportunities o ON a.opportunity_id = o.id
    WHERE o.recruiter_id = auth.uid()
    AND a.student_id::text = (storage.foldername(storage.objects.name))[1]
  )
);
