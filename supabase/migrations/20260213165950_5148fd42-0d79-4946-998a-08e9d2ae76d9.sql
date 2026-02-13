
-- Add student-specific columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS university text,
  ADD COLUMN IF NOT EXISTS registration_number text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS semester integer,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS skills text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS github_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS portfolio_url text,
  ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;

-- Mark all existing users as profile_completed so they aren't forced through the flow
UPDATE public.profiles SET profile_completed = true WHERE profile_completed IS NULL OR profile_completed = false;
