-- Create enums for status tracking
CREATE TYPE public.opportunity_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE public.opportunity_status AS ENUM ('draft', 'published', 'closed');
CREATE TYPE public.application_status AS ENUM ('pending', 'accepted', 'rejected', 'in_progress', 'completed', 'withdrawn');
CREATE TYPE public.submission_status AS ENUM ('pending', 'approved', 'needs_revision');

-- Opportunities table (posted by recruiters)
CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  company_name TEXT NOT NULL,
  location TEXT,
  is_remote BOOLEAN NOT NULL DEFAULT false,
  duration_hours INTEGER NOT NULL DEFAULT 40,
  level opportunity_level NOT NULL DEFAULT 'beginner',
  skills_required TEXT[] NOT NULL DEFAULT '{}',
  max_applicants INTEGER DEFAULT 10,
  status opportunity_status NOT NULL DEFAULT 'draft',
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Applications table (students apply to opportunities)
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  status application_status NOT NULL DEFAULT 'pending',
  cover_letter TEXT,
  resume_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(opportunity_id, student_id)
);

-- Tasks table (work items within an opportunity)
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  due_days INTEGER, -- days from application acceptance
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Task submissions (student work submissions)
CREATE TABLE public.task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  submission_url TEXT,
  notes TEXT,
  status submission_status NOT NULL DEFAULT 'pending',
  feedback TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(task_id, application_id)
);

-- Feedback/Evaluations table
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  skills_demonstrated TEXT[] NOT NULL DEFAULT '{}',
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Certificates table
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE UNIQUE,
  student_id UUID NOT NULL,
  verification_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- =====================
-- OPPORTUNITIES POLICIES
-- =====================

-- Anyone can view published opportunities
CREATE POLICY "Published opportunities are viewable by all"
ON public.opportunities FOR SELECT
USING (status = 'published' OR recruiter_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Recruiters can create opportunities
CREATE POLICY "Recruiters can create opportunities"
ON public.opportunities FOR INSERT
TO authenticated
WITH CHECK (recruiter_id = auth.uid() AND public.has_role(auth.uid(), 'recruiter'));

-- Recruiters can update their own opportunities
CREATE POLICY "Recruiters can update their opportunities"
ON public.opportunities FOR UPDATE
TO authenticated
USING (recruiter_id = auth.uid())
WITH CHECK (recruiter_id = auth.uid());

-- Recruiters can delete their own draft opportunities
CREATE POLICY "Recruiters can delete their draft opportunities"
ON public.opportunities FOR DELETE
TO authenticated
USING (recruiter_id = auth.uid() AND status = 'draft');

-- =====================
-- APPLICATIONS POLICIES
-- =====================

-- Students can view their own applications
CREATE POLICY "Students can view their applications"
ON public.applications FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Recruiters can view applications to their opportunities
CREATE POLICY "Recruiters can view applications to their opportunities"
ON public.applications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.opportunities
    WHERE id = opportunity_id AND recruiter_id = auth.uid()
  )
);

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
ON public.applications FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Students can create applications
CREATE POLICY "Students can create applications"
ON public.applications FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid() AND public.has_role(auth.uid(), 'student'));

-- Students can update their pending applications (withdraw)
CREATE POLICY "Students can update their applications"
ON public.applications FOR UPDATE
TO authenticated
USING (student_id = auth.uid() AND status = 'pending')
WITH CHECK (student_id = auth.uid());

-- Recruiters can update application status
CREATE POLICY "Recruiters can update application status"
ON public.applications FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.opportunities
    WHERE id = opportunity_id AND recruiter_id = auth.uid()
  )
);

-- =====================
-- TASKS POLICIES
-- =====================

-- Tasks are viewable by opportunity owner and accepted applicants
CREATE POLICY "Tasks viewable by stakeholders"
ON public.tasks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.opportunities WHERE id = opportunity_id AND recruiter_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.applications 
    WHERE opportunity_id = tasks.opportunity_id 
    AND student_id = auth.uid() 
    AND status IN ('accepted', 'in_progress', 'completed')
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Recruiters can create tasks for their opportunities
CREATE POLICY "Recruiters can create tasks"
ON public.tasks FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.opportunities WHERE id = opportunity_id AND recruiter_id = auth.uid()
  )
);

-- Recruiters can update their tasks
CREATE POLICY "Recruiters can update tasks"
ON public.tasks FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.opportunities WHERE id = opportunity_id AND recruiter_id = auth.uid()
  )
);

-- Recruiters can delete their tasks
CREATE POLICY "Recruiters can delete tasks"
ON public.tasks FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.opportunities WHERE id = opportunity_id AND recruiter_id = auth.uid()
  )
);

-- =====================
-- TASK SUBMISSIONS POLICIES
-- =====================

-- Students can view their own submissions
CREATE POLICY "Students can view their submissions"
ON public.task_submissions FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Recruiters can view submissions for their opportunities
CREATE POLICY "Recruiters can view submissions"
ON public.task_submissions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.opportunities o ON t.opportunity_id = o.id
    WHERE t.id = task_id AND o.recruiter_id = auth.uid()
  )
);

-- Students can create submissions
CREATE POLICY "Students can create submissions"
ON public.task_submissions FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid() AND public.has_role(auth.uid(), 'student'));

-- Students can update their pending submissions
CREATE POLICY "Students can update their submissions"
ON public.task_submissions FOR UPDATE
TO authenticated
USING (student_id = auth.uid() AND status = 'pending')
WITH CHECK (student_id = auth.uid());

-- Recruiters can update submission status (review)
CREATE POLICY "Recruiters can review submissions"
ON public.task_submissions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t
    JOIN public.opportunities o ON t.opportunity_id = o.id
    WHERE t.id = task_id AND o.recruiter_id = auth.uid()
  )
);

-- =====================
-- FEEDBACK POLICIES
-- =====================

-- Students can view feedback on their applications
CREATE POLICY "Students can view their feedback"
ON public.feedback FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.applications WHERE id = application_id AND student_id = auth.uid()
  )
);

-- Recruiters can view and create feedback
CREATE POLICY "Recruiters can view feedback they gave"
ON public.feedback FOR SELECT
TO authenticated
USING (evaluator_id = auth.uid());

CREATE POLICY "Recruiters can create feedback"
ON public.feedback FOR INSERT
TO authenticated
WITH CHECK (
  evaluator_id = auth.uid() 
  AND public.has_role(auth.uid(), 'recruiter')
  AND EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.opportunities o ON a.opportunity_id = o.id
    WHERE a.id = application_id AND o.recruiter_id = auth.uid()
  )
);

-- =====================
-- CERTIFICATES POLICIES
-- =====================

-- Certificates are publicly viewable (for verification)
CREATE POLICY "Certificates are publicly viewable"
ON public.certificates FOR SELECT
USING (true);

-- System creates certificates (via trigger or admin)
CREATE POLICY "Admins can create certificates"
ON public.certificates FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'recruiter'));

-- =====================
-- TRIGGERS FOR updated_at
-- =====================

CREATE TRIGGER update_opportunities_updated_at
BEFORE UPDATE ON public.opportunities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();