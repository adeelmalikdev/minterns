-- Allow recruiters to view profiles of students who applied to their opportunities
CREATE POLICY "Recruiters can view applicant profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM applications a
    JOIN opportunities o ON a.opportunity_id = o.id
    WHERE a.student_id = profiles.user_id
    AND o.recruiter_id = auth.uid()
  )
);