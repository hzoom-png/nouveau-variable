-- Add linkedin_url to profiles for founder onboarding
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
