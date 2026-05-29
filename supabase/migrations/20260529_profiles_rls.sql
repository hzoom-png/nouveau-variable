-- ============================================================
-- RLS on profiles table
-- ============================================================
-- Analysis before writing policies:
--   • anon client reads profiles by referral_code in auth/page.tsx (pre-auth referral lookup)
--   • authenticated server client reads own profile + other active profiles (annuaire)
--   • service client (bypasses RLS) used by all admin routes and cross-user operations
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- READ — anon: only active profiles (for referral code lookup pre-auth)
CREATE POLICY "profiles_anon_read_active"
  ON public.profiles FOR SELECT
  TO anon
  USING (is_active = true OR is_manually_activated = true);

-- READ — authenticated: own profile always + other active/visible profiles (for annuaire)
CREATE POLICY "profiles_auth_read"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR is_active = true
    OR is_manually_activated = true
  );

-- INSERT — authenticated users can only insert their own profile row
CREATE POLICY "profiles_self_insert"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE — authenticated users can only update their own profile
CREATE POLICY "profiles_self_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE — blocked for all non-service clients (service client bypasses RLS)
-- No DELETE policy = no deletion possible via anon/authenticated clients
