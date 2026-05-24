'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Kategori } from '@/lib/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Modal from '@/components/ui/Modal'
import { HiPlus, HiPencil, HiTrash, HiSearch } from 'react-icons/hi'
import toast from 'react-hot-toast'

export default function KategoriPage() {
  const [kategori, setKategori] = useState<(Kategori & { jumlah_buku: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedKategori, setSelectedKategori] = useState<Kategori | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [form, setForm] = useState({ nama_kategori: '', deskripsi: '' })

  const supabase = createClient()

  const fetchKategori = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase.from('kategori').select('*, buku(count)')

      if (search) {
        query = query.ilike('nama_kategori', `%${search}%`)
      }

      const { data, error } = await query.order('nama_kategori')
      if (error) throw error

      const formatted = (data || []).map((k: Record<string, unknown>) => ({
        ...k,
        jumlah_buku: (k.buku as { count: number }[])?.[0]?.count || 0,
      })) as (Kategori & { jumlah_buku: number })[]

      setKategori(formatted)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal memuat data kategori')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchKategori()
  }, [fetchKategori])

  const openAddModal = () => {
    setForm({ nama_kategori: '', deskripsi: '' })
    setSelectedKategori(null)
    setShowModal(true)
  }

  const openEditModal = (item: Kategori) => {
    setForm({ nama_kategori: item.nama_kategori, deskripsi: item.deskripsi || '' })
    setSelectedKategori(item)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nama_kategori.trim()) {
      toast.error('Nama kategori harus diisi')
      return
    }

    setFormLoading(true)
    try {
      const data = {
        nama_kategori: form.nama_kategori.trim(),
        deskripsi: form.deskripsi.trim() || null,
      }

      if (selectedKategori) {
        const { error } = await supabase.from('kategori').update(data).eq('id', selectedKategori.id)
        if (error) throw error
        toast.success('Kategori berhasil diperbarui')
      } else {
        const { error } = await supabase.from('kategori').insert(data)
        if (error) throw error
        toast.success('Kategori berhasil ditambahkan')
      }

      setShowModal(false)
      fetchKategori()
    } catch {
      toast.error('Gagal menyimpan kategori')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      // Check if kategori has books
      const { count } = await supabase.from('buku').select('*', { count: 'exact', head: true }).eq('id_kategori', deleteId)
      if (count && count > 0) {
        toast.error('Kategori masih digunakan oleh buku. Pindahkan buku ke kategori lain terlebih dahulu.')
        setDeleteId(null)
        return
      }

      const { error } = await supabase.from('kategori').delete().eq('id', deleteId)
      if (error) throw error
      toast.success('Kategori berhasil dihapus')
      setDeleteId(null)
      fetchKategori()
    } catch {
      toast.error('Gagal menghapus kategori')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Kategori</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola kategori buku perpustakaan</p>
        </div>
        <Button onClick={openAddModal} className="mt-3 sm:mt-0">
          <HiPlus className="w-4 h-4 mr-2" />
          Tambah Kategori
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="relative max-w-md">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : kategori.length === 0 ? (
          <EmptyState message="Belum ada data kategori" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">No</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Nama Kategori</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Deskripsi</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Jumlah Buku</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {kategori.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium">{item.nama_kategori}</td>
                    <td className="px-4 py-3 text-gray-600">{item.deskripsi || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.jumlah_buku} buku
                      </span>
                    </td>
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
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={selectedKategori ? 'Edit Kategori' : 'Tambah Kategori'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="nama_kategori"
            label="Nama Kategori *"
            value={form.nama_kategori}
            onChange={(e) => setForm({ ...form, nama_kategori: e.target.value })}
            placeholder="Masukkan nama kategori"
          />
          <div>
            <label htmlFor="deskripsi_kategori" className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea
              id="deskripsi_kategori"
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Deskripsi kategori..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Batal</Button>
            <Button type="submit" loading={formLoading}>{selectedKategori ? 'Simpan' : 'Tambah'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Kategori"
        message="Apakah Anda yakin ingin menghapus kategori ini?"
        loading={deleteLoading}
      />
    </div>
  )
}
