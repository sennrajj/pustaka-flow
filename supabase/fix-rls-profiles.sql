-- ============================================
-- FIX: RLS Profiles - Jalankan di SQL Editor
-- ============================================
-- Masalah: Setelah login, query ke profiles gagal karena RLS

-- Hapus semua policy lama di profiles
DROP POLICY IF EXISTS "Enable insert for trigger" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can manage profiles" ON profiles;

-- Buat policy baru yang benar
-- 1. Siapa saja bisa INSERT (untuk trigger saat signup)
CREATE POLICY "Allow insert from trigger" ON profiles
  FOR INSERT WITH CHECK (true);

-- 2. User bisa lihat profile sendiri
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

-- 3. Admin bisa lihat semua profiles
CREATE POLICY "Admin can read all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 4. Admin bisa update semua profiles
CREATE POLICY "Admin can update all profiles" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 5. Admin bisa delete profiles
CREATE POLICY "Admin can delete profiles" ON profiles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- 6. User bisa update profile sendiri (nama, avatar)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Verifikasi: cek apakah profile admin ada
SELECT id, user_id, nama, email, role FROM profiles;
