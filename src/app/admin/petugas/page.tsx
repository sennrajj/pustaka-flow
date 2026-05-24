'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Petugas } from '@/lib/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Modal from '@/components/ui/Modal'
import { HiPlus, HiPencil, HiTrash, HiSearch } from 'react-icons/hi'
import toast from 'react-hot-toast'

const ITEMS_PER_PAGE = 10

export default function PetugasPage() {
  const [petugas, setPetugas] = useState<Petugas[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [selectedPetugas, setSelectedPetugas] = useState<Petugas | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  const [form, setForm] = useState({
    nama: '',
    email: '',
    no_hp: '',
    alamat: '',
    password: '',
    status_akun: 'aktif' as 'aktif' | 'tidak_aktif',
  })

  const supabase = createClient()

  const fetchPetugas = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase.from('petugas').select('*', { count: 'exact' })

      if (search) {
        query = query.or(`nama.ilike.%${search}%,email.ilike.%${search}%,kode_petugas.ilike.%${search}%`)
      }
      if (filterStatus) {
        query = query.eq('status_akun', filterStatus)
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to)
      if (error) throw error
      setPetugas(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal memuat data petugas')
    } finally {
      setLoading(false)
    }
  }, [search, filterStatus, currentPage])

  useEffect(() => {
    fetchPetugas()
  }, [fetchPetugas])

  const generateKodePetugas = async () => {
    const { count } = await supabase.from('petugas').select('*', { count: 'exact', head: true })
    const nextNum = (count || 0) + 1
    return `PTG${String(nextNum).padStart(3, '0')}`
  }

  const openAddModal = () => {
    setForm({ nama: '', email: '', no_hp: '', alamat: '', password: '', status_akun: 'aktif' })
    setSelectedPetugas(null)
    setShowModal(true)
  }

  const openEditModal = (item: Petugas) => {
    setForm({
      nama: item.nama,
      email: item.email,
      no_hp: item.no_hp || '',
      alamat: item.alamat || '',
      password: '',
      status_akun: item.status_akun,
    })
    setSelectedPetugas(item)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nama || !form.email) {
      toast.error('Nama dan email harus diisi')
      return
    }

    setFormLoading(true)
    try {
      if (selectedPetugas) {
        const { error } = await supabase
          .from('petugas')
          .update({
            nama: form.nama,
            no_hp: form.no_hp || null,
            alamat: form.alamat || null,
            status_akun: form.status_akun,
          })
          .eq('id', selectedPetugas.id)
        if (error) throw error
        toast.success('Petugas berhasil diperbarui')
      } else {
        if (!form.password || form.password.length < 6) {
          toast.error('Password minimal 6 karakter')
          setFormLoading(false)
          return
        }

        const kode = await generateKodePetugas()

        // Create user via API route (doesn't affect current session)
        const res = await fetch('/api/auth/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            nama: form.nama,
            role: 'petugas',
          }),
        })

        const result = await res.json()
        if (!res.ok) throw new Error(result.error)

        const { error } = await supabase.from('petugas').insert({
          user_id: result.user?.id,
          kode_petugas: kode,
          nama: form.nama,
          email: form.email,
          no_hp: form.no_hp || null,
          alamat: form.alamat || null,
          status_akun: form.status_akun,
        })
        if (error) throw error
        toast.success('Petugas berhasil ditambahkan')
      }

      setShowModal(false)
      fetchPetugas()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan data petugas'
      toast.error(message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      const { error } = await supabase.from('petugas').delete().eq('id', deleteId)
      if (error) throw error
      toast.success('Petugas berhasil dihapus')
      setDeleteId(null)
      fetchPetugas()
    } catch {
      toast.error('Gagal menghapus petugas')
    } finally {
      setDeleteLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Petugas</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data petugas perpustakaan</p>
        </div>
        <Button onClick={openAddModal} className="mt-3 sm:mt-0">
          <HiPlus className="w-4 h-4 mr-2" />
          Tambah Petugas
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari petugas..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1) }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="tidak_aktif">Tidak Aktif</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : petugas.length === 0 ? (
          <EmptyState message="Belum ada data petugas" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Kode</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Nama</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">No. HP</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {petugas.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{item.kode_petugas}</td>
                    <td className="px-4 py-3 font-medium">{item.nama}</td>
                    <td className="px-4 py-3 text-gray-600">{item.email}</td>
                    <td className="px-4 py-3 text-gray-600">{item.no_hp || '-'}</td>
                    <td className="px-4 py-3"><Badge status={item.status_akun} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditModal(item)} className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600" title="Edit">
                          <HiPencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" title="Hapus">
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 py-3 border-t border-gray-200">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={selectedPetugas ? 'Edit Petugas' : 'Tambah Petugas'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="nama" label="Nama *" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama lengkap" />
          <Input id="email" label="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" disabled={!!selectedPetugas} />
          {!selectedPetugas && (
            <Input id="password" label="Password *" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimal 6 karakter" />
          )}
          <Input id="no_hp" label="No. HP" value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} placeholder="08xxxxxxxxxx" />
          <div>
            <label htmlFor="alamat" className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
            <textarea id="alamat" value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="status_akun" className="block text-sm font-medium text-gray-700 mb-1">Status Akun</label>
            <select id="status_akun" value={form.status_akun} onChange={(e) => setForm({ ...form, status_akun: e.target.value as 'aktif' | 'tidak_aktif' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="aktif">Aktif</option>
              <option value="tidak_aktif">Tidak Aktif</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Batal</Button>
            <Button type="submit" loading={formLoading}>{selectedPetugas ? 'Simpan' : 'Tambah'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Hapus Petugas" message="Apakah Anda yakin ingin menghapus petugas ini?" loading={deleteLoading} />
    </div>
  )
}
