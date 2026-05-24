'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function PengaturanPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    id: '',
    nama_perpustakaan: '',
    alamat: '',
    email: '',
    no_hp: '',
    tarif_denda_per_hari: '1000',
    batas_hari_peminjaman: '7',
    maksimal_buku_dipinjam: '3',
  })

  const supabase = createClient()

  useEffect(() => {
    async function fetchPengaturan() {
      try {
        const { data, error } = await supabase.from('pengaturan').select('*').single()
        if (error) throw error
        if (data) {
          setForm({
            id: data.id,
            nama_perpustakaan: data.nama_perpustakaan || '',
            alamat: data.alamat || '',
            email: data.email || '',
            no_hp: data.no_hp || '',
            tarif_denda_per_hari: data.tarif_denda_per_hari?.toString() || '1000',
            batas_hari_peminjaman: data.batas_hari_peminjaman?.toString() || '7',
            maksimal_buku_dipinjam: data.maksimal_buku_dipinjam?.toString() || '3',
          })
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPengaturan()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase
        .from('pengaturan')
        .update({
          nama_perpustakaan: form.nama_perpustakaan,
          alamat: form.alamat || null,
          email: form.email || null,
          no_hp: form.no_hp || null,
          tarif_denda_per_hari: parseInt(form.tarif_denda_per_hari) || 1000,
          batas_hari_peminjaman: parseInt(form.batas_hari_peminjaman) || 7,
          maksimal_buku_dipinjam: parseInt(form.maksimal_buku_dipinjam) || 3,
        })
        .eq('id', form.id)

      if (error) throw error
      toast.success('Pengaturan berhasil disimpan')
    } catch {
      toast.error('Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Sistem</h1>
        <p className="text-sm text-gray-500 mt-1">Konfigurasi perpustakaan dan aturan peminjaman</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        {/* Profil Perpustakaan */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profil Perpustakaan</h2>
          <div className="space-y-4">
            <Input id="nama_perpustakaan" label="Nama Perpustakaan" value={form.nama_perpustakaan} onChange={(e) => setForm({ ...form, nama_perpustakaan: e.target.value })} />
            <div>
              <label htmlFor="alamat" className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
              <textarea id="alamat" value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <Input id="email_perpustakaan" label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input id="no_hp_perpustakaan" label="No. Telepon" value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} />
          </div>
        </div>

        {/* Aturan Peminjaman */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Aturan Peminjaman</h2>
          <div className="space-y-4">
            <Input id="tarif_denda" label="Tarif Denda per Hari (Rp)" type="number" value={form.tarif_denda_per_hari} onChange={(e) => setForm({ ...form, tarif_denda_per_hari: e.target.value })} min="0" />
            <Input id="batas_hari" label="Batas Hari Peminjaman" type="number" value={form.batas_hari_peminjaman} onChange={(e) => setForm({ ...form, batas_hari_peminjaman: e.target.value })} min="1" />
            <Input id="maks_buku" label="Maksimal Buku Dipinjam" type="number" value={form.maksimal_buku_dipinjam} onChange={(e) => setForm({ ...form, maksimal_buku_dipinjam: e.target.value })} min="1" />
          </div>
        </div>

        <Button type="submit" loading={saving} size="lg">
          Simpan Pengaturan
        </Button>
      </form>
    </div>
  )
}
