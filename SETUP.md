# PustakaFlow - Panduan Setup Lengkap

## Sistem Informasi Peminjaman Buku Perpustakaan Berbasis Web

---

## LANGKAH 1: Buat Project Supabase

1. Buka https://supabase.com dan klik **Start your project**
2. Login dengan GitHub (atau buat akun baru)
3. Klik **New Project**
4. Isi form:
   - **Organization**: Pilih atau buat organisasi
   - **Name**: `pustakaflow`
   - **Database Password**: Buat password yang kuat (simpan baik-baik!)
   - **Region**: Pilih yang terdekat (misal: Singapore)
5. Klik **Create new project**
6. Tunggu hingga project selesai dibuat (sekitar 1-2 menit)

---

## LANGKAH 2: Ambil API Keys

1. Setelah project aktif, buka **Settings** (ikon gear di sidebar kiri)
2. Klik **API** di menu kiri
3. Catat 2 nilai berikut:
   - **Project URL** → contoh: `https://abcdefghijk.supabase.co`
   - **anon public key** → string panjang yang dimulai dengan `eyJ...`
4. Simpan kedua nilai ini, akan dipakai nanti

---

## LANGKAH 3: Setup Database

1. Di Supabase Dashboard, klik **SQL Editor** di sidebar kiri
2. Klik **New query**
3. Buka file `supabase/schema.sql` di project ini
4. **Copy SELURUH isi file** tersebut
5. **Paste** ke SQL Editor di Supabase
6. Klik tombol **Run** (atau tekan Ctrl+Enter)
7. Pastikan muncul pesan **Success. No rows returned** (artinya berhasil)

### Verifikasi Database:
1. Klik **Table Editor** di sidebar kiri
2. Pastikan tabel-tabel berikut sudah muncul:
   - profiles
   - pengaturan
   - kategori
   - buku
   - anggota
   - petugas
   - peminjaman
   - detail_peminjaman
   - pengembalian
   - denda
3. Klik tabel `pengaturan` → pastikan ada 1 row data default
4. Klik tabel `kategori` → pastikan ada 6 row data kategori

---

## LANGKAH 4: Setup Storage (Upload Sampul Buku)

1. Di Supabase Dashboard, klik **Storage** di sidebar kiri
2. Klik **New bucket**
3. Isi:
   - **Name**: `sampul-buku`
   - **Public bucket**: ✅ Centang (aktifkan)
4. Klik **Create bucket**
5. Setelah bucket dibuat, klik bucket `sampul-buku`
6. Klik tab **Policies**
7. Klik **New policy** → pilih **For full customization**
8. Buat policy berikut:

### Policy 1: Allow authenticated uploads
- **Policy name**: `Allow authenticated uploads`
- **Allowed operation**: INSERT
- **Target roles**: `authenticated`
- **Policy definition (USING expression)**: `true`
- Klik **Review** → **Save policy**

### Policy 2: Allow public read
- **Policy name**: `Allow public read`
- **Allowed operation**: SELECT
- **Target roles**: `public`
- **Policy definition (USING expression)**: `true`
- Klik **Review** → **Save policy**

### Policy 3: Allow authenticated update
- **Policy name**: `Allow authenticated update`
- **Allowed operation**: UPDATE
- **Target roles**: `authenticated`
- **Policy definition (USING expression)**: `true`
- Klik **Review** → **Save policy**

---

## LANGKAH 5: Buat Akun Admin Pertama

### 5a. Buat User di Authentication
1. Di Supabase Dashboard, klik **Authentication** di sidebar kiri
2. Klik tab **Users**
3. Klik **Add user** → **Create new user**
4. Isi:
   - **Email**: `admin@pustakaflow.com`
   - **Password**: `admin123456` (atau password pilihan Anda)
   - **Auto Confirm User**: ✅ Centang
5. Klik **Create user**
6. User akan muncul di daftar

### 5b. Set Role Admin di Database
1. Klik **SQL Editor** di sidebar kiri
2. Klik **New query**
3. Jalankan SQL berikut:

```sql
-- Set role admin untuk user yang baru dibuat
UPDATE profiles 
SET role = 'admin', nama = 'Administrator' 
WHERE email = 'admin@pustakaflow.com';
```

4. Klik **Run**
5. Pastikan muncul **Success. 1 row affected**

### 5c. Verifikasi
1. Klik **Table Editor** → pilih tabel `profiles`
2. Pastikan ada row dengan:
   - email: `admin@pustakaflow.com`
   - role: `admin`
   - nama: `Administrator`

---

## LANGKAH 6: Setup Project di Komputer Lokal

### 6a. Buat file Environment Variables
1. Buka folder project `pustaka-flow`
2. Buat file baru bernama `.env.local` (perhatikan titik di depan)
3. Isi dengan:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_ANON_KEY_HERE
```

4. Ganti `YOUR_PROJECT_ID` dengan Project URL dari Langkah 2
5. Ganti `YOUR_ANON_KEY_HERE` dengan anon key dari Langkah 2

### 6b. Install Dependencies (jika belum)
Buka terminal/command prompt di folder `pustaka-flow`:

```bash
npm install
```

### 6c. Jalankan Development Server
```bash
npm run dev
```

### 6d. Buka Aplikasi
1. Buka browser
2. Akses http://localhost:3000
3. Anda akan diarahkan ke halaman login
4. Login dengan:
   - **Email**: `admin@pustakaflow.com`
   - **Password**: `admin123456`
5. Setelah login, Anda akan masuk ke Dashboard Admin

---

## LANGKAH 7: Buat Akun Petugas (Melalui Aplikasi)

1. Login sebagai Admin
2. Klik menu **Data Petugas** di sidebar
3. Klik tombol **Tambah Petugas**
4. Isi form:
   - **Nama**: Nama petugas
   - **Email**: Email petugas (misal: `petugas1@pustakaflow.com`)
   - **Password**: Minimal 6 karakter
   - **No. HP**: Opsional
   - **Alamat**: Opsional
   - **Status**: Aktif
5. Klik **Tambah**
6. Petugas sekarang bisa login dengan email dan password tersebut

---

## LANGKAH 8: Buat Akun Anggota (Melalui Aplikasi)

1. Login sebagai Admin atau Petugas
2. Klik menu **Data Anggota** di sidebar
3. Klik tombol **Tambah Anggota**
4. Isi form:
   - **Nama**: Nama anggota
   - **Email**: Email anggota (misal: `anggota1@pustakaflow.com`)
   - **Password**: Minimal 6 karakter
   - **No. HP**: Opsional
   - **Alamat**: Opsional
   - **Status**: Aktif
5. Klik **Tambah**
6. Anggota sekarang bisa login dengan email dan password tersebut

---

## LANGKAH 9: Tambah Data Buku

1. Login sebagai Admin atau Petugas
2. Klik menu **Data Buku** di sidebar
3. Klik tombol **Tambah Buku**
4. Isi form:
   - **Kode Buku**: Otomatis terisi (BK001, BK002, dst)
   - **Judul**: Judul buku
   - **Penulis**: Nama penulis
   - **Penerbit**: Nama penerbit
   - **Tahun Terbit**: Tahun
   - **ISBN**: Nomor ISBN
   - **Kategori**: Pilih dari dropdown
   - **Stok**: Jumlah buku tersedia
   - **Deskripsi**: Deskripsi buku
   - **Sampul**: Upload gambar sampul (opsional)
5. Klik **Tambah Buku**

---

## LANGKAH 10: Proses Peminjaman Buku

1. Login sebagai Admin atau Petugas
2. Klik menu **Peminjaman** di sidebar
3. Klik tombol **Peminjaman Baru**
4. Pilih **Anggota** dari dropdown (hanya anggota aktif yang muncul)
5. Centang **Buku** yang ingin dipinjam (bisa lebih dari satu)
6. Klik **Proses Peminjaman**
7. Sistem otomatis:
   - Membuat kode peminjaman (PJM001, PJM002, dst)
   - Menentukan tanggal jatuh tempo (berdasarkan pengaturan)
   - Mengurangi stok buku
   - Mencatat petugas yang memproses

---

## LANGKAH 11: Proses Pengembalian Buku

1. Login sebagai Admin atau Petugas
2. Klik menu **Pengembalian** di sidebar
3. Klik tombol **Proses Pengembalian**
4. Pilih peminjaman aktif yang akan dikembalikan
5. Klik **Proses Pengembalian**
6. Sistem otomatis:
   - Menghitung hari keterlambatan
   - Menghitung denda (jika terlambat)
   - Mengembalikan stok buku
   - Mengubah status peminjaman menjadi "dikembalikan"
   - Membuat record denda (jika terlambat)

---

## LANGKAH 12: Kelola Denda

1. Login sebagai Admin atau Petugas
2. Klik menu **Denda** di sidebar
3. Lihat daftar denda yang belum dibayar
4. Klik tombol **Bayar** untuk mengubah status menjadi sudah dibayar
5. Anggota juga bisa melihat denda mereka di menu **Denda Saya**

---

## LANGKAH 13: Buat Laporan

1. Login sebagai Admin atau Petugas
2. Klik menu **Laporan** di sidebar
3. Pilih jenis laporan:
   - Laporan Buku
   - Laporan Anggota
   - Laporan Peminjaman
   - Laporan Pengembalian
   - Laporan Denda
   - Buku Sering Dipinjam
   - Buku Belum Dikembalikan
4. Atur filter tanggal (opsional)
5. Klik **Generate**
6. Untuk export:
   - Klik **Export Excel** → download file .xlsx
   - Klik **Export PDF** → download file .pdf

---

## LANGKAH 14: Atur Pengaturan Sistem

1. Login sebagai Admin
2. Klik menu **Pengaturan** di sidebar
3. Atur:
   - **Nama Perpustakaan**: Nama yang ditampilkan
   - **Alamat**: Alamat perpustakaan
   - **Email**: Email kontak
   - **No. Telepon**: Nomor telepon
   - **Tarif Denda per Hari**: Nominal denda per hari keterlambatan (dalam Rupiah)
   - **Batas Hari Peminjaman**: Berapa hari buku boleh dipinjam
   - **Maksimal Buku Dipinjam**: Berapa buku maksimal yang boleh dipinjam sekaligus
4. Klik **Simpan Pengaturan**

---

## LANGKAH 15: Deploy ke Vercel (Production)

### 15a. Push ke GitHub
1. Buat repository baru di GitHub (https://github.com/new)
2. Nama repository: `pustakaflow`
3. Biarkan kosong (jangan centang README, .gitignore, dll)
4. Di terminal, jalankan:

```bash
cd pustaka-flow
git add .
git commit -m "Initial commit - PustakaFlow"
git branch -M main
git remote add origin https://github.com/USERNAME_ANDA/pustakaflow.git
git push -u origin main
```

### 15b. Deploy di Vercel
1. Buka https://vercel.com dan login dengan GitHub
2. Klik **Add New** → **Project**
3. Pilih repository `pustakaflow` dari daftar
4. Di bagian **Environment Variables**, tambahkan:
   - `NEXT_PUBLIC_SUPABASE_URL` → isi dengan Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → isi dengan anon key
5. Klik **Deploy**
6. Tunggu proses build selesai (sekitar 2-3 menit)
7. Setelah selesai, Anda akan mendapat URL production (misal: `pustakaflow.vercel.app`)

### 15c. Konfigurasi Domain (Opsional)
1. Di Vercel Dashboard, buka project
2. Klik **Settings** → **Domains**
3. Tambahkan custom domain jika punya

---

## TROUBLESHOOTING

### Login gagal / "Email atau password salah"
- Pastikan user sudah di-confirm (Auto Confirm User dicentang saat buat user)
- Pastikan email dan password benar
- Cek tabel `profiles` apakah ada data untuk user tersebut

### Halaman kosong setelah login
- Pastikan tabel `profiles` memiliki data dengan `role` yang benar
- Jalankan ulang SQL di Langkah 5b

### Upload sampul gagal
- Pastikan bucket `sampul-buku` sudah dibuat dan bersifat public
- Pastikan policies storage sudah ditambahkan (Langkah 4)

### Data tidak muncul
- Pastikan Row Level Security (RLS) policies sudah dibuat (sudah termasuk di schema.sql)
- Cek di Supabase Dashboard → Authentication → Policies

### Build error saat deploy
- Pastikan environment variables sudah diisi di Vercel
- Pastikan tidak ada typo di URL atau key

### Denda tidak terhitung
- Pastikan pengaturan `tarif_denda_per_hari` sudah diisi di tabel `pengaturan`
- Denda hanya dihitung saat proses pengembalian

---

## RINGKASAN AKUN DEFAULT

| Role    | Email                    | Password    | Dashboard          |
|---------|--------------------------|-------------|---------------------|
| Admin   | admin@pustakaflow.com    | admin123456 | /admin/dashboard    |
| Petugas | (dibuat oleh admin)      | (custom)    | /petugas/dashboard  |
| Anggota | (dibuat oleh admin/ptgs) | (custom)    | /anggota/dashboard  |

---

## ALUR KERJA APLIKASI

```
Admin
├── Kelola Petugas (CRUD)
├── Kelola Semua Data Master
├── Lihat Semua Transaksi
├── Lihat Semua Laporan
└── Atur Pengaturan Sistem

Petugas
├── Kelola Buku (CRUD)
├── Kelola Anggota (CRUD)
├── Proses Peminjaman
├── Proses Pengembalian
├── Kelola Denda
└── Lihat Laporan

Anggota
├── Lihat Katalog Buku
├── Cari Buku
├── Lihat Riwayat Peminjaman
├── Lihat Denda
└── Edit Profil
```

---

## CATATAN PENTING

1. **Jangan share anon key** di tempat publik (meskipun ini adalah public key, tetap jaga keamanan)
2. **Backup database** secara berkala melalui Supabase Dashboard
3. **Ganti password admin** setelah setup pertama
4. **Supabase Free Tier** memiliki batasan:
   - 500MB database
   - 1GB storage
   - 2GB bandwidth per bulan
   - Cukup untuk perpustakaan kecil-menengah
5. Untuk production, pertimbangkan upgrade ke Supabase Pro ($25/bulan)
