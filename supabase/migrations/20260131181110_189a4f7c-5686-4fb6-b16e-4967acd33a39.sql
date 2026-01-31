-- Make task_id nullable to allow general submissions (not tied to a specific task)
ALTER TABLE public.task_submissions ALTER COLUMN task_id DROP NOT NULL;

-- Update RLS policy for recruiters to view submissions via application_id when task_id is null
DROP POLICY IF EXISTS "Recruiters can view submissions" ON public.task_submissions;
CREATE POLICY "Recruiters can view submissions" ON public.task_submissions
FOR SELECT USING (
  -- Via task -> opportunity -> recruiter
  (task_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM tasks t
    JOIN opportunities o ON t.opportunity_id = o.id
    WHERE t.id = task_submissions.task_id AND o.recruiter_id = auth.uid()
  ))
  OR
  -- Via application -> opportunity -> recruiter (for general submissions)
  (task_id IS NULL AND EXISTS (
    SELECT 1 FROM applications a
    JOIN opportunities o ON a.opportunity_id = o.id
    WHERE a.id = task_submissions.application_id AND o.recruiter_id = auth.uid()
  ))
);

-- Update RLS policy for recruiters to review submissions
DROP POLICY IF EXISTS "Recruiters can review submissions" ON public.task_submissions;
CREATE POLICY "Recruiters can review submissions" ON public.task_submissions
FOR UPDATE USING (
  (task_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM tasks t
    JOIN opportunities o ON t.opportunity_id = o.id
    WHERE t.id = task_submissions.task_id AND o.recruiter_id = auth.uid()
  ))
  OR
  (task_id IS NULL AND EXISTS (
    SELECT 1 FROM applications a
    JOIN opportunities o ON a.opportunity_id = o.id
    WHERE a.id = task_submissions.application_id AND o.recruiter_id = auth.uid()
  ))
);