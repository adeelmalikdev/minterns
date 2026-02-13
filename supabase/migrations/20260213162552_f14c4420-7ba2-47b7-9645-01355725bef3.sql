
-- Add company profile fields to profiles table for recruiters
ALTER TABLE public.profiles
ADD COLUMN company_name text,
ADD COLUMN company_logo_url text,
ADD COLUMN company_website text,
ADD COLUMN company_description text;

-- Add certificate_url to opportunities for recruiter-uploaded certificate templates
ALTER TABLE public.opportunities
ADD COLUMN certificate_url text;
