'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Peminjaman } from '@/lib/types'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { HiPlus, HiSearch, HiEye } from 'react-icons/hi'
import { formatDateShort } from '@/lib/utils'
import toast from 'react-hot-toast'

const ITEMS_PER_PAGE = 10

export default function PeminjamanPage() {
  const [peminjaman, setPeminjaman] = useState<Peminjaman[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selectedPeminjaman, setSelectedPeminjaman] = useState<Peminjaman | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // Form state for new peminjaman
  const [anggotaList, setAnggotaList] = useState<{ id: string; nama: string; kode_anggota: string }[]>([])
  const [bukuList, setBukuList] = useState<{ id: string; judul: string; kode_buku: string; stok: number }[]>([])
  const [selectedAnggota, setSelectedAnggota] = useState('')
  const [selectedBuku, setSelectedBuku] = useState<string[]>([])

  const supabase = createClient()

  const fetchPeminjaman = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('peminjaman')
        .select('*, anggota(nama, kode_anggota), petugas(nama)', { count: 'exact' })

      if (search) {
        query = query.or(`kode_peminjaman.ilike.%${search}%`)
      }
      if (filterStatus) {
        query = query.eq('status_peminjaman', filterStatus)
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to)
      if (error) throw error
      setPeminjaman(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal memuat data peminjaman')
    } finally {
      setLoading(false)
    }
  }, [search, filterStatus, currentPage])

  useEffect(() => {
    fetchPeminjaman()
  }, [fetchPeminjaman])

  const openAddModal = async () => {
    // Fetch anggota aktif
    const { data: anggotaData } = await supabase
      .from('anggota')
      .select('id, nama, kode_anggota')
      .eq('status_anggota', 'aktif')
      .order('nama')

    // Fetch buku tersedia
    const { data: bukuData } = await supabase
      .from('buku')
      .select('id, judul, kode_buku, stok')
      .gt('stok', 0)
      .order('judul')

    setAnggotaList(anggotaData || [])
    setBukuList(bukuData || [])
    setSelectedAnggota('')
    setSelectedBuku([])
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAnggota) {
      toast.error('Pilih anggota')
      return
    }
    if (selectedBuku.length === 0) {
      toast.error('Pilih minimal 1 buku')
      return
    }

    setFormLoading(true)
    try {
      // Get pengaturan
      const { data: pengaturan } = await supabase.from('pengaturan').select('*').single()
      const batasHari = pengaturan?.batas_hari_peminjaman || 7
      const maksimalBuku = pengaturan?.maksimal_buku_dipinjam || 3

      // Check max buku
      if (selectedBuku.length > maksimalBuku) {
        toast.error(`Maksimal ${maksimalBuku} buku per peminjaman`)
        setFormLoading(false)
        return
      }

      // Check existing active peminjaman
      const { count: activePeminjaman } = await supabase
        .from('peminjaman')
        .select('*', { count: 'exact', head: true })
        .eq('id_anggota', selectedAnggota)
        .eq('status_peminjaman', 'aktif')

      if ((activePeminjaman || 0) > 0) {
        // Count total books currently borrowed
        const { data: activeLoans } = await supabase
          .from('peminjaman')
          .select('id')
          .eq('id_anggota', selectedAnggota)
          .eq('status_peminjaman', 'aktif')

        if (activeLoans) {
          const { count: totalBorrowed } = await supabase
            .from('detail_peminjaman')
            .select('*', { count: 'exact', head: true })
            .in('id_peminjaman', activeLoans.map(l => l.id))

          if ((totalBorrowed || 0) + selectedBuku.length > maksimalBuku) {
            toast.error(`Anggota sudah meminjam ${totalBorrowed} buku. Maksimal ${maksimalBuku} buku.`)
            setFormLoading(false)
            return
          }
        }
      }

      // Get petugas (current user)
      const { data: { user } } = await supabase.auth.getUser()
      const { data: petugasData } = await supabase
        .from('petugas')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      // If admin, get first petugas or use admin's own record
      let petugasId = petugasData?.id
      if (!petugasId) {
        const { data: firstPetugas } = await supabase.from('petugas').select('id').limit(1).single()
        petugasId = firstPetugas?.id
      }

      if (!petugasId) {
        toast.error('Tidak ada petugas yang terdaftar')
        setFormLoading(false)
        return
      }

      // Generate kode
      const { count: peminjamanCount } = await supabase.from('peminjaman').select('*', { count: 'exact', head: true })
      const kodePeminjaman = `PJM${String((peminjamanCount || 0) + 1).padStart(3, '0')}`

      // Calculate dates
      const tanggalPinjam = new Date().toISOString().split('T')[0]
      const jatuhTempo = new Date()
      jatuhTempo.setDate(jatuhTempo.getDate() + batasHari)
      const tanggalJatuhTempo = jatuhTempo.toISOString().split('T')[0]

      // Insert peminjaman
      const { data: newPeminjaman, error: peminjamanError } = await supabase
        .from('peminjaman')
        .insert({
          kode_peminjaman: kodePeminjaman,
          id_anggota: selectedAnggota,
          id_petugas: petugasId,
          tanggal_pinjam: tanggalPinjam,
          tanggal_jatuh_tempo: tanggalJatuhTempo,
          status_peminjaman: 'aktif',
        })
        .select()
        .single()

      if (peminjamanError) throw peminjamanError

      // Insert detail peminjaman
      const details = selectedBuku.map(bukuId => ({
        id_peminjaman: newPeminjaman.id,
        id_buku: bukuId,
        jumlah: 1,
      }))

      const { error: detailError } = await supabase.from('detail_peminjaman').insert(details)
      if (detailError) throw detailError

      // Update stok buku
      for (const bukuId of selectedBuku) {
        await supabase.rpc('decrement_stok', { buku_id: bukuId, jumlah: 1 }).then(({ error }) => {
          if (error) {
            // Fallback: manual update
            supabase.from('buku').select('stok').eq('id', bukuId).single().then(({ data }) => {
              if (data) {
                supabase.from('buku').update({ stok: data.stok - 1 }).eq('id', bukuId)
              }
            })
          }
        })
      }

      toast.success(`Peminjaman ${kodePeminjaman} berhasil dibuat`)
      setShowModal(false)
      fetchPeminjaman()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gagal membuat peminjaman'
      toast.error(message)
    } finally {
      setFormLoading(false)
    }
  }

  const viewDetail = async (item: Peminjaman) => {
    const { data: details } = await supabase
      .from('detail_peminjaman')
      .select('*, buku(judul, kode_buku)')
      .eq('id_peminjaman', item.id)

    setSelectedPeminjaman({ ...item, detail_peminjaman: details || [] })
    setShowDetail(true)
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Peminjaman</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola transaksi peminjaman buku</p>
        </div>
        <Button onClick={openAddModal} className="mt-3 sm:mt-0">
          <HiPlus className="w-4 h-4 mr-2" />
          Peminjaman Baru
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari kode peminjaman..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1) }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="dikembalikan">Dikembalikan</option>
            <option value="terlambat">Terlambat</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : peminjaman.length === 0 ? (
          <EmptyState message="Belum ada data peminjaman" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Kode</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Anggota</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Tgl Pinjam</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Jatuh Tempo</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {peminjaman.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{item.kode_peminjaman}</td>
                    <td className="px-4 py-3 font-medium">
                      {(item as Peminjaman & { anggota?: { nama: string } }).anggota?.nama || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDateShort(item.tanggal_pinjam)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDateShort(item.tanggal_jatuh_tempo)}</td>
                    <td className="px-4 py-3"><Badge status={item.status_peminjaman} /></td>
                    <td className="px-4 py-3">
                      <button onClick={() => viewDetail(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Detail">
                        <HiEye className="w-4 h-4" />
                      </button>
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

      {/* Add Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Peminjaman Baru" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="anggota" className="block text-sm font-medium text-gray-700 mb-1">Pilih Anggota *</label>
            <select id="anggota" value={selectedAnggota} onChange={(e) => setSelectedAnggota(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">-- Pilih Anggota --</option>
              {anggotaList.map((a) => (
                <option key={a.id} value={a.id}>{a.kode_anggota} - {a.nama}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Buku * (bisa lebih dari satu)</label>
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-2 space-y-1">
              {bukuList.map((b) => (
                <label key={b.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedBuku.includes(b.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBuku([...selectedBuku, b.id])
                      } else {
                        setSelectedBuku(selectedBuku.filter(id => id !== b.id))
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{b.kode_buku} - {b.judul} (Stok: {b.stok})</span>
                </label>
              ))}
            </div>
            {selectedBuku.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">{selectedBuku.length} buku dipilih</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Batal</Button>
            <Button type="submit" loading={formLoading}>Proses Peminjaman</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Detail Peminjaman">
        {selectedPeminjaman && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-gray-500">Kode:</span> <span className="font-medium">{selectedPeminjaman.kode_peminjaman}</span></div>
              <div><span className="text-gray-500">Status:</span> <Badge status={selectedPeminjaman.status_peminjaman} /></div>
              <div><span className="text-gray-500">Tgl Pinjam:</span> <span className="font-medium">{formatDateShort(selectedPeminjaman.tanggal_pinjam)}</span></div>
              <div><span className="text-gray-500">Jatuh Tempo:</span> <span className="font-medium">{formatDateShort(selectedPeminjaman.tanggal_jatuh_tempo)}</span></div>
            </div>
            {selectedPeminjaman.detail_peminjaman && selectedPeminjaman.detail_peminjaman.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Buku yang dipinjam:</h4>
                <ul className="space-y-1">
                  {selectedPeminjaman.detail_peminjaman.map((d) => (
                    <li key={d.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span>{(d as { buku?: { kode_buku: string; judul: string } }).buku?.kode_buku}</span>
                      <span className="font-medium">{(d as { buku?: { kode_buku: string; judul: string } }).buku?.judul}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
