-- Create table for 2FA settings
CREATE TABLE public.user_2fa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  totp_secret TEXT, -- Encrypted TOTP secret
  totp_enabled BOOLEAN DEFAULT false,
  backup_codes TEXT[], -- Hashed backup codes
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

-- Users can only access their own 2FA settings
CREATE POLICY "Users can view own 2FA settings"
ON public.user_2fa FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own 2FA settings"
ON public.user_2fa FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own 2FA settings"
ON public.user_2fa FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own 2FA settings"
ON public.user_2fa FOR DELETE
USING (auth.uid() = user_id);

-- Add columns to profiles for account management
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deletion_scheduled_for TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_deactivated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'system',
ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en';

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Avatar storage policies
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Avatars are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Function to cancel account deletion
CREATE OR REPLACE FUNCTION public.cancel_account_deletion()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    deletion_requested_at = NULL,
    deletion_scheduled_for = NULL,
    is_deactivated = false
  WHERE user_id = auth.uid();
END;
$$;

-- Trigger for updated_at on user_2fa
CREATE TRIGGER update_user_2fa_updated_at
BEFORE UPDATE ON public.user_2fa
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();