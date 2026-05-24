'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Buku, Kategori } from '@/lib/types'
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

export default function BukuPage() {
  const [buku, setBuku] = useState<Buku[]>([])
  const [kategori, setKategori] = useState<Kategori[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selectedBuku, setSelectedBuku] = useState<Buku | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  // Form state
  const [form, setForm] = useState({
    kode_buku: '',
    judul: '',
    penulis: '',
    penerbit: '',
    tahun_terbit: '',
    isbn: '',
    id_kategori: '',
    deskripsi: '',
    stok: '0',
  })
  const [sampulFile, setSampulFile] = useState<File | null>(null)

  const supabase = createClient()

  const fetchBuku = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('buku')
        .select('*, kategori(nama_kategori)', { count: 'exact' })

      if (search) {
        query = query.or(`judul.ilike.%${search}%,penulis.ilike.%${search}%,penerbit.ilike.%${search}%,isbn.ilike.%${search}%,kode_buku.ilike.%${search}%`)
      }
      if (filterKategori) {
        query = query.eq('id_kategori', filterKategori)
      }
      if (filterStatus) {
        query = query.eq('status_buku', filterStatus)
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error
      setBuku(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error fetching buku:', error)
      toast.error('Gagal memuat data buku')
    } finally {
      setLoading(false)
    }
  }, [search, filterKategori, filterStatus, currentPage])

  const fetchKategori = async () => {
    const { data } = await supabase.from('kategori').select('*').order('nama_kategori')
    setKategori(data || [])
  }

  useEffect(() => {
    fetchKategori()
  }, [])

  useEffect(() => {
    fetchBuku()
  }, [fetchBuku])

  const generateKodeBuku = async () => {
    const { count } = await supabase.from('buku').select('*', { count: 'exact', head: true })
    const nextNum = (count || 0) + 1
    return `BK${String(nextNum).padStart(3, '0')}`
  }

  const openAddModal = async () => {
    const kode = await generateKodeBuku()
    setForm({
      kode_buku: kode,
      judul: '',
      penulis: '',
      penerbit: '',
      tahun_terbit: '',
      isbn: '',
      id_kategori: '',
      deskripsi: '',
      stok: '0',
    })
    setSampulFile(null)
    setSelectedBuku(null)
    setShowModal(true)
  }

  const openEditModal = (item: Buku) => {
    setForm({
      kode_buku: item.kode_buku,
      judul: item.judul,
      penulis: item.penulis,
      penerbit: item.penerbit || '',
      tahun_terbit: item.tahun_terbit?.toString() || '',
      isbn: item.isbn || '',
      id_kategori: item.id_kategori || '',
      deskripsi: item.deskripsi || '',
      stok: item.stok.toString(),
    })
    setSampulFile(null)
    setSelectedBuku(item)
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.judul || !form.penulis) {
      toast.error('Judul dan penulis harus diisi')
      return
    }

    setFormLoading(true)
    try {
      let sampul_url = selectedBuku?.sampul_url || null

      // Upload sampul if file selected
      if (sampulFile) {
        const fileExt = sampulFile.name.split('.').pop()
        const fileName = `${form.kode_buku}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('sampul-buku')
          .upload(fileName, sampulFile, { upsert: true })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('sampul-buku')
          .getPublicUrl(fileName)
        sampul_url = urlData.publicUrl
      }

      const stok = parseInt(form.stok) || 0
      const status_buku = stok === 0 ? 'stok_habis' : 'tersedia'

      const bukuData = {
        kode_buku: form.kode_buku,
        judul: form.judul,
        penulis: form.penulis,
        penerbit: form.penerbit || null,
        tahun_terbit: form.tahun_terbit ? parseInt(form.tahun_terbit) : null,
        isbn: form.isbn || null,
        id_kategori: form.id_kategori || null,
        deskripsi: form.deskripsi || null,
        sampul_url,
        stok,
        status_buku,
      }

      if (selectedBuku) {
        const { error } = await supabase
          .from('buku')
          .update(bukuData)
          .eq('id', selectedBuku.id)
        if (error) throw error
        toast.success('Buku berhasil diperbarui')
      } else {
        const { error } = await supabase.from('buku').insert(bukuData)
        if (error) throw error
        toast.success('Buku berhasil ditambahkan')
      }

      setShowModal(false)
      fetchBuku()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan data buku'
      toast.error(message)
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      const { error } = await supabase.from('buku').delete().eq('id', deleteId)
      if (error) throw error
      toast.success('Buku berhasil dihapus')
      setDeleteId(null)
      fetchBuku()
    } catch {
      toast.error('Gagal menghapus buku. Pastikan buku tidak sedang dipinjam.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Buku</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data buku perpustakaan</p>
        </div>
        <Button onClick={openAddModal} className="mt-3 sm:mt-0">
          <HiPlus className="w-4 h-4 mr-2" />
          Tambah Buku
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari buku..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={filterKategori}
            onChange={(e) => { setFilterKategori(e.target.value); setCurrentPage(1) }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Kategori</option>
            {kategori.map((k) => (
              <option key={k.id} value={k.id}>{k.nama_kategori}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1) }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Status</option>
            <option value="tersedia">Tersedia</option>
            <option value="dipinjam">Dipinjam</option>
            <option value="stok_habis">Stok Habis</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : buku.length === 0 ? (
          <EmptyState message="Belum ada data buku" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Kode</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Judul</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Penulis</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Kategori</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Stok</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {buku.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{item.kode_buku}</td>
                    <td className="px-4 py-3 font-medium">{item.judul}</td>
                    <td className="px-4 py-3 text-gray-600">{item.penulis}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {(item as Buku & { kategori?: { nama_kategori: string } }).kategori?.nama_kategori || '-'}
                    </td>
                    <td className="px-4 py-3">{item.stok}</td>
                    <td className="px-4 py-3"><Badge status={item.status_buku} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setSelectedBuku(item); setShowDetail(true) }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"
                          title="Detail"
                        >
                          <HiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600"
                          title="Edit"
                        >
                          <HiPencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
                          title="Hapus"
                        >
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
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedBuku ? 'Edit Buku' : 'Tambah Buku'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="kode_buku"
              label="Kode Buku"
              value={form.kode_buku}
              onChange={(e) => setForm({ ...form, kode_buku: e.target.value })}
              disabled
            />
            <Input
              id="judul"
              label="Judul *"
              value={form.judul}
              onChange={(e) => setForm({ ...form, judul: e.target.value })}
              placeholder="Masukkan judul buku"
            />
            <Input
              id="penulis"
              label="Penulis *"
              value={form.penulis}
              onChange={(e) => setForm({ ...form, penulis: e.target.value })}
              placeholder="Masukkan nama penulis"
            />
            <Input
              id="penerbit"
              label="Penerbit"
              value={form.penerbit}
              onChange={(e) => setForm({ ...form, penerbit: e.target.value })}
              placeholder="Masukkan nama penerbit"
            />
            <Input
              id="tahun_terbit"
              label="Tahun Terbit"
              type="number"
              value={form.tahun_terbit}
              onChange={(e) => setForm({ ...form, tahun_terbit: e.target.value })}
              placeholder="2024"
            />
            <Input
              id="isbn"
              label="ISBN"
              value={form.isbn}
              onChange={(e) => setForm({ ...form, isbn: e.target.value })}
              placeholder="978-xxx-xxx"
            />
            <div>
              <label htmlFor="id_kategori" className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select
                id="id_kategori"
                value={form.id_kategori}
                onChange={(e) => setForm({ ...form, id_kategori: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih Kategori</option>
                {kategori.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama_kategori}</option>
                ))}
              </select>
            </div>
            <Input
              id="stok"
              label="Stok"
              type="number"
              value={form.stok}
              onChange={(e) => setForm({ ...form, stok: e.target.value })}
              min="0"
            />
          </div>
          <div>
            <label htmlFor="deskripsi" className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea
              id="deskripsi"
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Deskripsi buku..."
            />
          </div>
          <div>
            <label htmlFor="sampul" className="block text-sm font-medium text-gray-700 mb-1">Sampul Buku</label>
            <input
              id="sampul"
              type="file"
              accept="image/*"
              onChange={(e) => setSampulFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button type="submit" loading={formLoading}>
              {selectedBuku ? 'Simpan Perubahan' : 'Tambah Buku'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        title="Detail Buku"
      >
        {selectedBuku && (
          <div className="space-y-3">
            {selectedBuku.sampul_url && (
              <img src={selectedBuku.sampul_url} alt={selectedBuku.judul} className="w-32 h-44 object-cover rounded-lg" />
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Kode:</span> <span className="font-medium">{selectedBuku.kode_buku}</span></div>
              <div><span className="text-gray-500">Judul:</span> <span className="font-medium">{selectedBuku.judul}</span></div>
              <div><span className="text-gray-500">Penulis:</span> <span className="font-medium">{selectedBuku.penulis}</span></div>
              <div><span className="text-gray-500">Penerbit:</span> <span className="font-medium">{selectedBuku.penerbit || '-'}</span></div>
              <div><span className="text-gray-500">Tahun:</span> <span className="font-medium">{selectedBuku.tahun_terbit || '-'}</span></div>
              <div><span className="text-gray-500">ISBN:</span> <span className="font-medium">{selectedBuku.isbn || '-'}</span></div>
              <div><span className="text-gray-500">Stok:</span> <span className="font-medium">{selectedBuku.stok}</span></div>
              <div><span className="text-gray-500">Status:</span> <Badge status={selectedBuku.status_buku} /></div>
            </div>
            {selectedBuku.deskripsi && (
              <div className="text-sm">
                <span className="text-gray-500">Deskripsi:</span>
                <p className="mt-1 text-gray-700">{selectedBuku.deskripsi}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Buku"
        message="Apakah Anda yakin ingin menghapus buku ini? Tindakan ini tidak dapat dibatalkan."
        loading={deleteLoading}
      />
    </div>
  )
}
