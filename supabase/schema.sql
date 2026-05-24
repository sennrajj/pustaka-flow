-- ============================================
-- PustakaFlow Database Schema
-- Sistem Informasi Peminjaman Buku Perpustakaan
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================
CREATE TYPE user_role AS ENUM ('admin', 'petugas', 'anggota');
CREATE TYPE status_anggota AS ENUM ('aktif', 'tidak_aktif');
CREATE TYPE status_akun AS ENUM ('aktif', 'tidak_aktif');
CREATE TYPE status_buku AS ENUM ('tersedia', 'dipinjam', 'stok_habis');
CREATE TYPE status_peminjaman AS ENUM ('aktif', 'dikembalikan', 'terlambat');
CREATE TYPE status_pengembalian AS ENUM ('selesai');
CREATE TYPE status_denda AS ENUM ('belum_dibayar', 'sudah_dibayar');

-- ============================================
-- TABLE: profiles
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nama VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'anggota',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: pengaturan
-- ============================================
CREATE TABLE pengaturan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_perpustakaan VARCHAR(255) NOT NULL DEFAULT 'PustakaFlow',
  logo_url TEXT,
  alamat TEXT,
  email VARCHAR(255),
  no_hp VARCHAR(20),
  tarif_denda_per_hari INTEGER NOT NULL DEFAULT 1000,
  batas_hari_peminjaman INTEGER NOT NULL DEFAULT 7,
  maksimal_buku_dipinjam INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: kategori
-- ============================================
CREATE TABLE kategori (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama_kategori VARCHAR(255) NOT NULL,
  deskripsi TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: buku
-- ============================================
CREATE TABLE buku (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kode_buku VARCHAR(50) UNIQUE NOT NULL,
  judul VARCHAR(255) NOT NULL,
  penulis VARCHAR(255) NOT NULL,
  penerbit VARCHAR(255),
  tahun_terbit INTEGER,
  isbn VARCHAR(20),
  id_kategori UUID REFERENCES kategori(id) ON DELETE SET NULL,
  deskripsi TEXT,
  sampul_url TEXT,
  stok INTEGER NOT NULL DEFAULT 0,
  status_buku status_buku NOT NULL DEFAULT 'tersedia',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: anggota
-- ============================================
CREATE TABLE anggota (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  kode_anggota VARCHAR(50) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  no_hp VARCHAR(20),
  alamat TEXT,
  status_anggota status_anggota NOT NULL DEFAULT 'aktif',
  tanggal_daftar DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: petugas
-- ============================================
CREATE TABLE petugas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  kode_petugas VARCHAR(50) UNIQUE NOT NULL,
  nama VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  no_hp VARCHAR(20),
  alamat TEXT,
  status_akun status_akun NOT NULL DEFAULT 'aktif',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: peminjaman
-- ============================================
CREATE TABLE peminjaman (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kode_peminjaman VARCHAR(50) UNIQUE NOT NULL,
  id_anggota UUID NOT NULL REFERENCES anggota(id) ON DELETE RESTRICT,
  id_petugas UUID NOT NULL REFERENCES petugas(id) ON DELETE RESTRICT,
  tanggal_pinjam DATE NOT NULL DEFAULT CURRENT_DATE,
  tanggal_jatuh_tempo DATE NOT NULL,
  status_peminjaman status_peminjaman NOT NULL DEFAULT 'aktif',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: detail_peminjaman
-- ============================================
CREATE TABLE detail_peminjaman (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_peminjaman UUID NOT NULL REFERENCES peminjaman(id) ON DELETE CASCADE,
  id_buku UUID NOT NULL REFERENCES buku(id) ON DELETE RESTRICT,
  jumlah INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: pengembalian
-- ============================================
CREATE TABLE pengembalian (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kode_pengembalian VARCHAR(50) UNIQUE NOT NULL,
  id_peminjaman UUID UNIQUE NOT NULL REFERENCES peminjaman(id) ON DELETE RESTRICT,
  id_petugas UUID NOT NULL REFERENCES petugas(id) ON DELETE RESTRICT,
  tanggal_pengembalian DATE NOT NULL DEFAULT CURRENT_DATE,
  jumlah_hari_terlambat INTEGER NOT NULL DEFAULT 0,
  total_denda INTEGER NOT NULL DEFAULT 0,
  status_pengembalian status_pengembalian NOT NULL DEFAULT 'selesai',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: denda
-- ============================================
CREATE TABLE denda (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_pengembalian UUID NOT NULL REFERENCES pengembalian(id) ON DELETE CASCADE,
  id_anggota UUID NOT NULL REFERENCES anggota(id) ON DELETE RESTRICT,
  jumlah_hari_terlambat INTEGER NOT NULL DEFAULT 0,
  tarif_per_hari INTEGER NOT NULL DEFAULT 1000,
  total_denda INTEGER NOT NULL DEFAULT 0,
  status_denda status_denda NOT NULL DEFAULT 'belum_dibayar',
  tanggal_bayar DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_buku_kategori ON buku(id_kategori);
CREATE INDEX idx_buku_status ON buku(status_buku);
CREATE INDEX idx_anggota_status ON anggota(status_anggota);
CREATE INDEX idx_peminjaman_anggota ON peminjaman(id_anggota);
CREATE INDEX idx_peminjaman_status ON peminjaman(status_peminjaman);
CREATE INDEX idx_detail_peminjaman_peminjaman ON detail_peminjaman(id_peminjaman);
CREATE INDEX idx_detail_peminjaman_buku ON detail_peminjaman(id_buku);
CREATE INDEX idx_pengembalian_peminjaman ON pengembalian(id_peminjaman);
CREATE INDEX idx_denda_anggota ON denda(id_anggota);
CREATE INDEX idx_denda_status ON denda(status_denda);

-- ============================================
-- TRIGGERS: Auto update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pengaturan_updated_at BEFORE UPDATE ON pengaturan FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kategori_updated_at BEFORE UPDATE ON kategori FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_buku_updated_at BEFORE UPDATE ON buku FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_anggota_updated_at BEFORE UPDATE ON anggota FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_petugas_updated_at BEFORE UPDATE ON petugas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_peminjaman_updated_at BEFORE UPDATE ON peminjaman FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pengembalian_updated_at BEFORE UPDATE ON pengembalian FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_denda_updated_at BEFORE UPDATE ON denda FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER: Auto update status buku based on stok
-- ============================================
CREATE OR REPLACE FUNCTION update_status_buku()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stok = 0 THEN
    NEW.status_buku = 'stok_habis';
  ELSIF NEW.stok > 0 AND OLD.stok = 0 THEN
    NEW.status_buku = 'tersedia';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_status_buku BEFORE UPDATE ON buku FOR EACH ROW EXECUTE FUNCTION update_status_buku();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengaturan ENABLE ROW LEVEL SECURITY;
ALTER TABLE kategori ENABLE ROW LEVEL SECURITY;
ALTER TABLE buku ENABLE ROW LEVEL SECURITY;
ALTER TABLE anggota ENABLE ROW LEVEL SECURITY;
ALTER TABLE petugas ENABLE ROW LEVEL SECURITY;
ALTER TABLE peminjaman ENABLE ROW LEVEL SECURITY;
ALTER TABLE detail_peminjaman ENABLE ROW LEVEL SECURITY;
ALTER TABLE pengembalian ENABLE ROW LEVEL SECURITY;
ALTER TABLE denda ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Enable insert for trigger" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin can update profiles" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin can delete profiles" ON profiles FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Pengaturan policies
CREATE POLICY "Anyone authenticated can view pengaturan" ON pengaturan FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage pengaturan" ON pengaturan FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Kategori policies
CREATE POLICY "Anyone authenticated can view kategori" ON kategori FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin and petugas can manage kategori" ON kategori FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'petugas'))
);

-- Buku policies
CREATE POLICY "Anyone authenticated can view buku" ON buku FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin and petugas can manage buku" ON buku FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'petugas'))
);

-- Anggota policies
CREATE POLICY "Admin and petugas can view anggota" ON anggota FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'petugas'))
);
CREATE POLICY "Anggota can view own data" ON anggota FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin and petugas can manage anggota" ON anggota FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'petugas'))
);

-- Petugas policies
CREATE POLICY "Admin can view petugas" ON petugas FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Petugas can view own data" ON petugas FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin can manage petugas" ON petugas FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Peminjaman policies
CREATE POLICY "Admin and petugas can view peminjaman" ON peminjaman FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'petugas'))
);
CREATE POLICY "Anggota can view own peminjaman" ON peminjaman FOR SELECT USING (
  id_anggota IN (SELECT id FROM anggota WHERE user_id = auth.uid())
);
CREATE POLICY "Petugas can manage peminjaman" ON peminjaman FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'petugas'))
);

-- Detail peminjaman policies
CREATE POLICY "Admin and petugas can view detail_peminjaman" ON detail_peminjaman FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'petugas'))
);
CREATE POLICY "Anggota can view own detail_peminjaman" ON detail_peminjaman FOR SELECT USING (
  id_peminjaman IN (
    SELECT p.id FROM peminjaman p
    JOIN anggota a ON p.id_anggota = a.id
    WHERE a.user_id = auth.uid()
  )
);
CREATE POLICY "Petugas can manage detail_peminjaman" ON detail_peminjaman FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'petugas'))
);

-- Pengembalian policies
CREATE POLICY "Admin and petugas can view pengembalian" ON pengembalian FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'petugas'))
);
CREATE POLICY "Anggota can view own pengembalian" ON pengembalian FOR SELECT USING (
  id_peminjaman IN (
    SELECT p.id FROM peminjaman p
    JOIN anggota a ON p.id_anggota = a.id
    WHERE a.user_id = auth.uid()
  )
);
CREATE POLICY "Petugas can manage pengembalian" ON pengembalian FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'petugas'))
);

-- Denda policies
CREATE POLICY "Admin and petugas can view denda" ON denda FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'petugas'))
);
CREATE POLICY "Anggota can view own denda" ON denda FOR SELECT USING (
  id_anggota IN (SELECT id FROM anggota WHERE user_id = auth.uid())
);
CREATE POLICY "Petugas can manage denda" ON denda FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'petugas'))
);

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default pengaturan
INSERT INTO pengaturan (nama_perpustakaan, alamat, email, no_hp, tarif_denda_per_hari, batas_hari_peminjaman, maksimal_buku_dipinjam)
VALUES ('PustakaFlow', 'Jl. Perpustakaan No. 1', 'admin@pustakaflow.com', '081234567890', 1000, 7, 3);

-- Insert default kategori
INSERT INTO kategori (nama_kategori, deskripsi) VALUES
('Fiksi', 'Buku-buku fiksi seperti novel, cerpen, dan cerita fantasi'),
('Non-Fiksi', 'Buku-buku non-fiksi seperti biografi, sejarah, dan sains'),
('Teknologi', 'Buku-buku tentang teknologi dan komputer'),
('Pendidikan', 'Buku-buku pelajaran dan pendidikan'),
('Agama', 'Buku-buku keagamaan'),
('Seni & Budaya', 'Buku-buku tentang seni dan budaya');

-- ============================================
-- FUNCTION: Create profile on signup
-- ============================================
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
  RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
