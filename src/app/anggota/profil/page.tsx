'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

export default function ProfilPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nama: '',
    email: '',
    no_hp: '',
    alamat: '',
    kode_anggota: '',
  })

  const supabase = createClient()

  useEffect(() => {
    async function fetchProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: anggota } = await supabase
          .from('anggota')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (anggota) {
          setForm({
            nama: anggota.nama,
            email: anggota.email,
            no_hp: anggota.no_hp || '',
            alamat: anggota.alamat || '',
            kode_anggota: anggota.kode_anggota,
          })
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('anggota')
        .update({
          nama: form.nama,
          no_hp: form.no_hp || null,
          alamat: form.alamat || null,
        })
        .eq('user_id', user.id)

      if (error) throw error
      toast.success('Profil berhasil diperbarui')
    } catch {
      toast.error('Gagal memperbarui profil')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola informasi profil Anda</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <Input id="kode" label="Kode Anggota" value={form.kode_anggota} disabled />
          <Input id="email" label="Email" value={form.email} disabled />
          <Input id="nama" label="Nama" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} />
          <Input id="no_hp" label="No. HP" value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} />
          <div>
            <label htmlFor="alamat" className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
            <textarea id="alamat" value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <Button type="submit" loading={saving}>Simpan Perubahan</Button>
        </div>
      </form>
    </div>
  )
}
