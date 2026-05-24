export type UserRole = 'admin' | 'petugas' | 'anggota'
export type StatusAnggota = 'aktif' | 'tidak_aktif'
export type StatusAkun = 'aktif' | 'tidak_aktif'
export type StatusBuku = 'tersedia' | 'dipinjam' | 'stok_habis'
export type StatusPeminjaman = 'aktif' | 'dikembalikan' | 'terlambat'
export type StatusDenda = 'belum_dibayar' | 'sudah_dibayar'

export interface Profile {
  id: string
  user_id: string
  nama: string
  email: string
  role: UserRole
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Pengaturan {
  id: string
  nama_perpustakaan: string
  logo_url?: string
  alamat?: string
  email?: string
  no_hp?: string
  tarif_denda_per_hari: number
  batas_hari_peminjaman: number
  maksimal_buku_dipinjam: number
  created_at: string
  updated_at: string
}

export interface Kategori {
  id: string
  nama_kategori: string
  deskripsi?: string
  created_at: string
  updated_at: string
  jumlah_buku?: number
}

export interface Buku {
  id: string
  kode_buku: string
  judul: string
  penulis: string
  penerbit?: string
  tahun_terbit?: number
  isbn?: string
  id_kategori?: string
  deskripsi?: string
  sampul_url?: string
  stok: number
  status_buku: StatusBuku
  created_at: string
  updated_at: string
  kategori?: Kategori
}

export interface Anggota {
  id: string
  user_id?: string
  kode_anggota: string
  nama: string
  email: string
  no_hp?: string
  alamat?: string
  status_anggota: StatusAnggota
  tanggal_daftar: string
  created_at: string
  updated_at: string
}

export interface Petugas {
  id: string
  user_id?: string
  kode_petugas: string
  nama: string
  email: string
  no_hp?: string
  alamat?: string
  status_akun: StatusAkun
  created_at: string
  updated_at: string
}

export interface Peminjaman {
  id: string
  kode_peminjaman: string
  id_anggota: string
  id_petugas: string
  tanggal_pinjam: string
  tanggal_jatuh_tempo: string
  status_peminjaman: StatusPeminjaman
  created_at: string
  updated_at: string
  anggota?: Anggota
  petugas?: Petugas
  detail_peminjaman?: DetailPeminjaman[]
}

export interface DetailPeminjaman {
  id: string
  id_peminjaman: string
  id_buku: string
  jumlah: number
  created_at: string
  buku?: Buku
}

export interface Pengembalian {
  id: string
  kode_pengembalian: string
  id_peminjaman: string
  id_petugas: string
  tanggal_pengembalian: string
  jumlah_hari_terlambat: number
  total_denda: number
  status_pengembalian: string
  created_at: string
  updated_at: string
  peminjaman?: Peminjaman
  petugas?: Petugas
}

export interface Denda {
  id: string
  id_pengembalian: string
  id_anggota: string
  jumlah_hari_terlambat: number
  tarif_per_hari: number
  total_denda: number
  status_denda: StatusDenda
  tanggal_bayar?: string
  created_at: string
  updated_at: string
  anggota?: Anggota
  pengembalian?: Pengembalian
}
