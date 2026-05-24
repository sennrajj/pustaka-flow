-- ============================================
-- SEED ADMIN USER
-- ============================================
-- Jalankan SQL ini SETELAH membuat user admin melalui Supabase Auth Dashboard
-- atau melalui Supabase CLI.
--
-- LANGKAH MEMBUAT ADMIN PERTAMA:
-- 1. Buka Supabase Dashboard > Authentication > Users
-- 2. Klik "Add User" > "Create New User"
-- 3. Masukkan email: admin@pustakaflow.com, password: admin123456
-- 4. Centang "Auto Confirm User"
-- 5. Setelah user dibuat, copy UUID user tersebut
-- 6. Jalankan SQL di bawah ini (ganti UUID sesuai user yang dibuat)

-- Ganti 'YOUR_ADMIN_USER_UUID' dengan UUID user admin yang sudah dibuat
-- UPDATE profiles SET role = 'admin' WHERE user_id = 'YOUR_ADMIN_USER_UUID';

-- Atau jika ingin langsung set role saat signup, gunakan metadata:
-- Saat membuat user di Supabase Dashboard, tambahkan metadata:
-- { "nama": "Administrator", "role": "admin" }

-- Alternatif: Jika trigger handle_new_user sudah aktif,
-- cukup buat user dengan metadata role = 'admin' dan profile akan otomatis dibuat.

-- Contoh manual insert (jika trigger tidak berjalan):
-- INSERT INTO profiles (user_id, nama, email, role)
-- VALUES ('YOUR_ADMIN_USER_UUID', 'Administrator', 'admin@pustakaflow.com', 'admin');
