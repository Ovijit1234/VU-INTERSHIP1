-- ============================================================================
-- MediCompare BD: Updated Supabase PostgreSQL Schema & Role-Based RLS Policies
-- Only your owner account (ovijitsaha1517@gmail.com) gets role = 'admin'.
-- All other signed-up users get role = 'visitor' (user-only permissions).
-- ============================================================================

-- 1. TABLES
CREATE TABLE IF NOT EXISTS public.diagnostic_centres (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  hours TEXT NOT NULL,
  home_collection BOOLEAN NOT NULL DEFAULT true,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.medical_tests (
  id BIGSERIAL PRIMARY KEY,
  centre_id TEXT NOT NULL REFERENCES public.diagnostic_centres(id) ON DELETE CASCADE,
  test_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  prep TEXT NOT NULL DEFAULT '',
  UNIQUE (centre_id, test_id)
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  area TEXT NOT NULL DEFAULT 'Dhanmondi',
  role TEXT NOT NULL DEFAULT 'visitor' CHECK (role IN ('visitor', 'admin')),
  saved_tests JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.patient_reviews (
  id TEXT PRIMARY KEY,
  centre_id TEXT NOT NULL REFERENCES public.diagnostic_centres(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TEXT NOT NULL,
  verified_visitor BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.sample_bookings (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  centre_id TEXT NOT NULL REFERENCES public.diagnostic_centres(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  preferred_date TEXT NOT NULL,
  collection_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Completed')),
  created_at TEXT NOT NULL
);

-- 2. ROLE HELPER FUNCTIONS & AUTO-PROFILE TRIGGER
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, area, role, saved_tests)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'Patient Member'),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'area', 'Dhanmondi'),
    CASE
      WHEN lower(COALESCE(NEW.email, '')) = 'ovijitsaha1517@gmail.com' THEN 'admin'
      ELSE 'visitor'
    END,
    COALESCE(NEW.raw_user_meta_data->'savedTests', '[]'::jsonb)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = CASE
      WHEN lower(EXCLUDED.email) = 'ovijitsaha1517@gmail.com' THEN 'admin'
      ELSE public.profiles.role
    END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.diagnostic_centres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sample_bookings ENABLE ROW LEVEL SECURITY;

-- Centres: public read-only; ONLY admin user can insert/update/delete
DROP POLICY IF EXISTS "Public read centres" ON public.diagnostic_centres;
CREATE POLICY "Public read centres" ON public.diagnostic_centres
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Manage centres" ON public.diagnostic_centres;
DROP POLICY IF EXISTS "Admin manage centres" ON public.diagnostic_centres;
CREATE POLICY "Admin manage centres" ON public.diagnostic_centres
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Tests: public read-only; ONLY admin user can insert/update/delete
DROP POLICY IF EXISTS "Public read tests" ON public.medical_tests;
CREATE POLICY "Public read tests" ON public.medical_tests
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Manage tests" ON public.medical_tests;
DROP POLICY IF EXISTS "Admin manage tests" ON public.medical_tests;
CREATE POLICY "Admin manage tests" ON public.medical_tests
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Profiles: users can read/insert/update own profile, but cannot self-promote role
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id
    AND (
      role = 'visitor'
      OR lower(email) = 'ovijitsaha1517@gmail.com'
    )
  );

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (role = public.get_my_role() OR public.is_admin())
  );

-- Patient Reviews: anyone can read; ONLY signed-in users can insert; admin or author can delete
DROP POLICY IF EXISTS "Public read reviews" ON public.patient_reviews;
CREATE POLICY "Public read reviews" ON public.patient_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Signed in users insert reviews" ON public.patient_reviews;
CREATE POLICY "Signed in users insert reviews" ON public.patient_reviews
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Manage reviews" ON public.patient_reviews;
DROP POLICY IF EXISTS "Admin or author delete reviews" ON public.patient_reviews;
CREATE POLICY "Admin or author delete reviews" ON public.patient_reviews
  FOR DELETE USING (public.is_admin() OR auth.uid() = user_id);

-- Sample Bookings: anyone can submit; users read their own; admin manages all
DROP POLICY IF EXISTS "Public insert bookings" ON public.sample_bookings;
CREATE POLICY "Public insert bookings" ON public.sample_bookings
  FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Read bookings" ON public.sample_bookings;
DROP POLICY IF EXISTS "Read own or admin bookings" ON public.sample_bookings;
CREATE POLICY "Read own or admin bookings" ON public.sample_bookings
  FOR SELECT USING (public.is_admin() OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Update bookings" ON public.sample_bookings;
DROP POLICY IF EXISTS "Admin update bookings" ON public.sample_bookings;
CREATE POLICY "Admin update bookings" ON public.sample_bookings
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Delete bookings" ON public.sample_bookings;
DROP POLICY IF EXISTS "Admin delete bookings" ON public.sample_bookings;
CREATE POLICY "Admin delete bookings" ON public.sample_bookings
  FOR DELETE USING (public.is_admin());

-- 4. BACKFILL EXISTING AUTH USERS & GRANT ADMIN TO YOUR EMAIL
INSERT INTO public.profiles (id, name, email, area, role, saved_tests)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1), 'Patient Member'),
  COALESCE(email, ''),
  COALESCE(raw_user_meta_data->>'area', 'Dhanmondi'),
  CASE
    WHEN lower(COALESCE(email, '')) = 'ovijitsaha1517@gmail.com' THEN 'admin'
    ELSE 'visitor'
  END,
  '[]'::jsonb
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = CASE
    WHEN lower(EXCLUDED.email) = 'ovijitsaha1517@gmail.com' THEN 'admin'
    ELSE public.profiles.role
  END;
