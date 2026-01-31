-- Allow students to view recruiter profiles for their accepted applications
CREATE POLICY "Students can view recruiter profiles for their applications"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM applications a
    JOIN opportunities o ON a.opportunity_id = o.id
    WHERE o.recruiter_id = profiles.user_id
    AND a.student_id = auth.uid()
    AND a.status IN ('accepted', 'in_progress', 'completed')
  )
);