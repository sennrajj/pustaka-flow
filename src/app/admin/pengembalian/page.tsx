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
import { HiSearch, HiEye, HiCheckCircle } from 'react-icons/hi'
import { formatDateShort, formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

const ITEMS_PER_PAGE = 10

export default function PengembalianPage() {
  const [pengembalian, setPengembalian] = useState<Record<string, unknown>[]>([])
  const [peminjamanAktif, setPeminjamanAktif] = useState<Peminjaman[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [selectedPeminjaman, setSelectedPeminjaman] = useState<Peminjaman | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  const supabase = createClient()

  const fetchPengembalian = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('pengembalian')
        .select('*, peminjaman(kode_peminjaman, anggota(nama)), petugas(nama)', { count: 'exact' })

      if (search) {
        query = query.ilike('kode_pengembalian', `%${search}%`)
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to)
      if (error) throw error
      setPengembalian(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [search, currentPage])

  useEffect(() => {
    fetchPengembalian()
  }, [fetchPengembalian])

  const openReturnModal = async () => {
    const { data } = await supabase
      .from('peminjaman')
      .select('*, anggota(nama, kode_anggota), detail_peminjaman(*, buku(judul, kode_buku))')
      .eq('status_peminjaman', 'aktif')
      .order('tanggal_jatuh_tempo')

    setPeminjamanAktif(data || [])
    setSelectedPeminjaman(null)
    setShowModal(true)
  }

  const handleReturn = async () => {
    if (!selectedPeminjaman) {
      toast.error('Pilih peminjaman yang akan dikembalikan')
      return
    }

    setFormLoading(true)
    try {
      // Get pengaturan
      const { data: pengaturan } = await supabase.from('pengaturan').select('tarif_denda_per_hari').single()
      const tarifDenda = pengaturan?.tarif_denda_per_hari || 1000

      // Calculate late days
      const today = new Date()
      const jatuhTempo = new Date(selectedPeminjaman.tanggal_jatuh_tempo)
      const diffTime = today.getTime() - jatuhTempo.getTime()
      const hariTerlambat = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
      const totalDenda = hariTerlambat * tarifDenda

      // Get petugas
      const { data: { user } } = await supabase.auth.getUser()
      const { data: petugasData } = await supabase.from('petugas').select('id').eq('user_id', user?.id).single()
      let petugasId = petugasData?.id
      if (!petugasId) {
        const { data: firstPetugas } = await supabase.from('petugas').select('id').limit(1).single()
        petugasId = firstPetugas?.id
      }

      // Generate kode
      const { count } = await supabase.from('pengembalian').select('*', { count: 'exact', head: true })
      const kodePengembalian = `KMB${String((count || 0) + 1).padStart(3, '0')}`

      // Insert pengembalian
      const { data: newPengembalian, error: returnError } = await supabase
        .from('pengembalian')
        .insert({
          kode_pengembalian: kodePengembalian,
          id_peminjaman: selectedPeminjaman.id,
          id_petugas: petugasId,
          tanggal_pengembalian: today.toISOString().split('T')[0],
          jumlah_hari_terlambat: hariTerlambat,
          total_denda: totalDenda,
          status_pengembalian: 'selesai',
        })
        .select()
        .single()

      if (returnError) throw returnError

      // Update peminjaman status
      await supabase
        .from('peminjaman')
        .update({ status_peminjaman: 'dikembalikan' })
        .eq('id', selectedPeminjaman.id)

      // Restore book stock
      const { data: details } = await supabase
        .from('detail_peminjaman')
        .select('id_buku, jumlah')
        .eq('id_peminjaman', selectedPeminjaman.id)

      if (details) {
        for (const detail of details) {
          const { data: buku } = await supabase.from('buku').select('stok').eq('id', detail.id_buku).single()
          if (buku) {
            await supabase.from('buku').update({ stok: buku.stok + detail.jumlah }).eq('id', detail.id_buku)
          }
        }
      }

      // Insert denda if late
      if (hariTerlambat > 0 && totalDenda > 0) {
        await supabase.from('denda').insert({
          id_pengembalian: newPengembalian.id,
          id_anggota: selectedPeminjaman.id_anggota,
          jumlah_hari_terlambat: hariTerlambat,
          tarif_per_hari: tarifDenda,
          total_denda: totalDenda,
          status_denda: 'belum_dibayar',
        })
      }

      toast.success(`Pengembalian ${kodePengembalian} berhasil diproses${hariTerlambat > 0 ? `. Denda: ${formatCurrency(totalDenda)}` : ''}`)
      setShowModal(false)
      fetchPengembalian()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gagal memproses pengembalian'
      toast.error(message)
    } finally {
      setFormLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Pengembalian</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola transaksi pengembalian buku</p>
        </div>
        <Button onClick={openReturnModal} className="mt-3 sm:mt-0">
          <HiCheckCircle className="w-4 h-4 mr-2" />
          Proses Pengembalian
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="relative max-w-md">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Cari kode pengembalian..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : pengembalian.length === 0 ? (
          <EmptyState message="Belum ada data pengembalian" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Kode</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Kode Peminjaman</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Tgl Kembali</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Hari Terlambat</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Denda</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pengembalian.map((item) => (
                  <tr key={item.id as string} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{item.kode_pengembalian as string}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {(item.peminjaman as { kode_peminjaman: string })?.kode_peminjaman || '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDateShort(item.tanggal_pengembalian as string)}</td>
                    <td className="px-4 py-3">{item.jumlah_hari_terlambat as number} hari</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(item.total_denda as number)}</td>
                    <td className="px-4 py-3"><Badge status={item.status_pengembalian as string} /></td>
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

      {/* Return Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Proses Pengembalian" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Pilih peminjaman aktif yang akan dikembalikan:</p>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {peminjamanAktif.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Tidak ada peminjaman aktif</p>
            ) : (
              peminjamanAktif.map((p) => (
                <label
                  key={p.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedPeminjaman?.id === p.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="peminjaman"
                    checked={selectedPeminjaman?.id === p.id}
                    onChange={() => setSelectedPeminjaman(p)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{p.kode_peminjaman} - {(p as Peminjaman & { anggota?: { nama: string } }).anggota?.nama}</p>
                    <p className="text-xs text-gray-500">Jatuh tempo: {formatDateShort(p.tanggal_jatuh_tempo)}</p>
                  </div>
                  {new Date() > new Date(p.tanggal_jatuh_tempo) && (
                    <span className="text-xs text-red-600 font-medium">Terlambat</span>
                  )}
                </label>
              ))
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
            <Button onClick={handleReturn} loading={formLoading} disabled={!selectedPeminjaman}>
              Proses Pengembalian
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
