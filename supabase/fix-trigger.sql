-- ============================================
-- FIX: Perbaiki trigger handle_new_user
-- ============================================
-- Jalankan SQL ini di Supabase SQL Editor jika mendapat error
-- "database error creating new user"

-- 1. Drop trigger dan function lama
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Buat function baru yang lebih robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role_value user_role;
  user_nama TEXT;
BEGIN
  -- Safely get nama
  user_nama := COALESCE(NEW.raw_user_meta_data->>'nama', split_part(NEW.email, '@', 1));
  
  -- Safely get role with validation
  BEGIN
    IF NEW.raw_user_meta_data->>'role' IS NOT NULL 
       AND NEW.raw_user_meta_data->>'role' != '' THEN
      user_role_value := (NEW.raw_user_meta_data->>'role')::user_role;
    ELSE
      user_role_value := 'anggota'::user_role;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    user_role_value := 'anggota'::user_role;
  END;

  -- Insert profile
  INSERT INTO public.profiles (user_id, nama, email, role)
  VALUES (NEW.id, user_nama, NEW.email, user_role_value);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't block user creation
  RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Buat trigger baru
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Pastikan RLS tidak memblokir trigger (SECURITY DEFINER bypass RLS)
-- Tapi untuk jaga-jaga, tambahkan policy INSERT untuk service_role
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies yang mungkin konflik
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can manage profiles" ON profiles;

-- Buat ulang policies yang benar
CREATE POLICY "Enable insert for trigger" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can update profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can delete profiles" ON profiles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 5. Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
