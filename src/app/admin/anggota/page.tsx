'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Anggota } from '@/lib/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Modal from '@/components/ui/Modal'
import { HiPlus, HiPencil, HiTrash, HiSearch, HiEye } from 'react-icons/hi'
import toast from 'react-hot-toast'

const ITEMS_PER_PAGE = 10

export default function AnggotaPage() {
  const [anggota, setAnggota] = useState<Anggota[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selectedAnggota, setSelectedAnggota] = useState<Anggota | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  const [form, setForm] = useState({
    nama: '',
    email: '',
    no_hp: '',
    alamat: '',
    password: '',
    status_anggota: 'aktif' as 'aktif' | 'tidak_aktif',
  })

  const supabase = createClient()

  const fetchAnggota = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase.from('anggota').select('*', { count: 'exact' })

      if (search) {
        query = query.or(`nama.ilike.%${search}%,email.ilike.%${search}%,no_hp.ilike.%${search}%,kode_anggota.ilike.%${search}%`)
      }
      if (filterStatus) {
        query = query.eq('status_anggota', filterStatus)
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to)
      if (error) throw error
      setAnggota(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal memuat data anggota')
    } finally {
      setLoading(false)
    }
  }, [search, filterStatus, currentPage])

  useEffect(() => {
    fetchAnggota()
  }, [fetchAnggota])

  const generateKodeAnggota = async () => {
    const { count } = await supabase.from('anggota').select('*', { count: 'exact', head: true })
    const nextNum = (count || 0) + 1
    return `AGT${String(nextNum).padStart(3, '0')}`
  }

  const openAddModal = () => {
    setForm({ nama: '', email: '', no_hp: '', alamat: '', password: '', status_anggota: 'aktif' })
    setSelectedAnggota(null)
    setShowModal(true)
  }

  const openEditModal = (item: Anggota) => {
    setForm({
      nama: item.nama,
      email: item.email,
      no_hp: item.no_hp || '',
      alamat: item.alamat || '',
      password: '',
      status_anggota: item.status_anggota,
    })
    setSelectedAnggota(item)
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
      if (selectedAnggota) {
        // Update anggota
        const { error } = await supabase
          .from('anggota')
          .update({
            nama: form.nama,
            email: form.email,
            no_hp: form.no_hp || null,
            alamat: form.alamat || null,
            status_anggota: form.status_anggota,
          })
          .eq('id', selectedAnggota.id)
        if (error) throw error
        toast.success('Anggota berhasil diperbarui')
      } else {
        // Create new user in Supabase Auth
        if (!form.password || form.password.length < 6) {
          toast.error('Password minimal 6 karakter')
          setFormLoading(false)
          return
        }

        const kode = await generateKodeAnggota()

        // Create user via API route (doesn't affect current session)
        const res = await fetch('/api/auth/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            nama: form.nama,
            role: 'anggota',
          }),
        })

        const result = await res.json()
        if (!res.ok) throw new Error(result.error)

        // Insert anggota record
        const { error } = await supabase.from('anggota').insert({
          user_id: result.user?.id,
          kode_anggota: kode,
          nama: form.nama,
          email: form.email,
          no_hp: form.no_hp || null,
          alamat: form.alamat || null,
          status_anggota: form.status_anggota,
        })
        if (error) throw error
        toast.success('Anggota berhasil ditambahkan')
      }

      setShowModal(false)
      fetchAnggota()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan data anggota'
      toast.error(message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      const { error } = await supabase.from('anggota').delete().eq('id', deleteId)
      if (error) throw error
      toast.success('Anggota berhasil dihapus')
      setDeleteId(null)
      fetchAnggota()
    } catch {
      toast.error('Gagal menghapus anggota. Pastikan anggota tidak memiliki peminjaman aktif.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Anggota</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data anggota perpustakaan</p>
        </div>
        <Button onClick={openAddModal} className="mt-3 sm:mt-0">
          <HiPlus className="w-4 h-4 mr-2" />
          Tambah Anggota
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari anggota..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1) }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
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
        ) : anggota.length === 0 ? (
          <EmptyState message="Belum ada data anggota" />
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
                {anggota.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{item.kode_anggota}</td>
                    <td className="px-4 py-3 font-medium">{item.nama}</td>
                    <td className="px-4 py-3 text-gray-600">{item.email}</td>
                    <td className="px-4 py-3 text-gray-600">{item.no_hp || '-'}</td>
                    <td className="px-4 py-3"><Badge status={item.status_anggota} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setSelectedAnggota(item); setShowDetail(true) }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Detail">
                          <HiEye className="w-4 h-4" />
                        </button>
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

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={selectedAnggota ? 'Edit Anggota' : 'Tambah Anggota'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="nama" label="Nama *" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama lengkap" />
          <Input id="email" label="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" disabled={!!selectedAnggota} />
          {!selectedAnggota && (
            <Input id="password" label="Password *" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimal 6 karakter" />
          )}
          <Input id="no_hp" label="No. HP" value={form.no_hp} onChange={(e) => setForm({ ...form, no_hp: e.target.value })} placeholder="08xxxxxxxxxx" />
          <div>
            <label htmlFor="alamat" className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
            <textarea id="alamat" value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Alamat lengkap" />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select id="status" value={form.status_anggota} onChange={(e) => setForm({ ...form, status_anggota: e.target.value as 'aktif' | 'tidak_aktif' })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="aktif">Aktif</option>
              <option value="tidak_aktif">Tidak Aktif</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Batal</Button>
            <Button type="submit" loading={formLoading}>{selectedAnggota ? 'Simpan' : 'Tambah'}</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Detail Anggota">
        {selectedAnggota && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-gray-500">Kode:</span> <span className="font-medium">{selectedAnggota.kode_anggota}</span></div>
              <div><span className="text-gray-500">Nama:</span> <span className="font-medium">{selectedAnggota.nama}</span></div>
              <div><span className="text-gray-500">Email:</span> <span className="font-medium">{selectedAnggota.email}</span></div>
              <div><span className="text-gray-500">No. HP:</span> <span className="font-medium">{selectedAnggota.no_hp || '-'}</span></div>
              <div><span className="text-gray-500">Status:</span> <Badge status={selectedAnggota.status_anggota} /></div>
              <div><span className="text-gray-500">Tgl Daftar:</span> <span className="font-medium">{selectedAnggota.tanggal_daftar}</span></div>
            </div>
            {selectedAnggota.alamat && (
              <div><span className="text-gray-500">Alamat:</span> <p className="font-medium mt-1">{selectedAnggota.alamat}</p></div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Hapus Anggota" message="Apakah Anda yakin ingin menghapus anggota ini?" loading={deleteLoading} />
    </div>
  )
}
