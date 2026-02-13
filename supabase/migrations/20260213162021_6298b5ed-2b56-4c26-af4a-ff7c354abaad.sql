
-- Create a table for public site feedback (distinct from recruiter evaluation feedback)
CREATE TABLE public.site_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone (even anonymous) can submit feedback
CREATE POLICY "Anyone can submit feedback"
ON public.site_feedback
FOR INSERT
WITH CHECK (true);

-- Only admins can read feedback
CREATE POLICY "Admins can view all feedback"
ON public.site_feedback
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));
