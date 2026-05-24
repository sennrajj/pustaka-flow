-- ============================================
-- FITUR BARU: Wishlist & Request Peminjaman
-- Jalankan di Supabase SQL Editor
-- ============================================

-- 1. Tabel wishlist (simpan/like buku)
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_anggota UUID NOT NULL REFERENCES anggota(id) ON DELETE CASCADE,
  id_buku UUID NOT NULL REFERENCES buku(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id_anggota, id_buku)
);

CREATE INDEX idx_wishlist_anggota ON wishlist(id_anggota);
CREATE INDEX idx_wishlist_buku ON wishlist(id_buku);

-- 2. Tabel request peminjaman
CREATE TYPE status_request AS ENUM ('pending', 'disetujui', 'ditolak');

CREATE TABLE IF NOT EXISTS request_peminjaman (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_anggota UUID NOT NULL REFERENCES anggota(id) ON DELETE CASCADE,
  id_buku UUID NOT NULL REFERENCES buku(id) ON DELETE RESTRICT,
  status_request status_request NOT NULL DEFAULT 'pending',
  catatan TEXT,
  catatan_admin TEXT,
  tanggal_request TIMESTAMPTZ DEFAULT NOW(),
  tanggal_diproses TIMESTAMPTZ,
  id_petugas UUID REFERENCES petugas(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_request_anggota ON request_peminjaman(id_anggota);
CREATE INDEX idx_request_status ON request_peminjaman(status_request);

-- 3. Trigger updated_at
CREATE TRIGGER update_request_peminjaman_updated_at 
  BEFORE UPDATE ON request_peminjaman 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. RLS disabled (sama seperti profiles, untuk kemudahan)
ALTER TABLE wishlist DISABLE ROW LEVEL SECURITY;
ALTER TABLE request_peminjaman DISABLE ROW LEVEL SECURITY;
