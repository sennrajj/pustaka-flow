'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { HiSearch } from 'react-icons/hi'
import { formatCurrency, formatDateShort } from '@/lib/utils'
import toast from 'react-hot-toast'

const ITEMS_PER_PAGE = 10

export default function DendaPage() {
  const [denda, setDenda] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const supabase = createClient()

  const fetchDenda = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('denda')
        .select('*, anggota(nama, kode_anggota), pengembalian(kode_pengembalian)', { count: 'exact' })

      if (filterStatus) {
        query = query.eq('status_denda', filterStatus)
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to)
      if (error) throw error
      setDenda(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, currentPage])

  useEffect(() => {
    fetchDenda()
  }, [fetchDenda])

  const handleBayar = async (id: string) => {
    try {
      const { error } = await supabase
        .from('denda')
        .update({ status_denda: 'sudah_dibayar', tanggal_bayar: new Date().toISOString().split('T')[0] })
        .eq('id', id)
      if (error) throw error
      toast.success('Denda berhasil dibayar')
      fetchDenda()
    } catch {
      toast.error('Gagal mengubah status denda')
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Data Denda</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola data denda keterlambatan</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1) }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Status</option>
            <option value="belum_dibayar">Belum Dibayar</option>
            <option value="sudah_dibayar">Sudah Dibayar</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : denda.length === 0 ? (
          <EmptyState message="Belum ada data denda" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Anggota</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Kode Pengembalian</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Hari Terlambat</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Tarif/Hari</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Total Denda</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {denda.map((item) => (
                  <tr key={item.id as string} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {(item.anggota as { nama: string })?.nama || '-'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {(item.pengembalian as { kode_pengembalian: string })?.kode_pengembalian || '-'}
                    </td>
                    <td className="px-4 py-3">{item.jumlah_hari_terlambat as number} hari</td>
                    <td className="px-4 py-3">{formatCurrency(item.tarif_per_hari as number)}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(item.total_denda as number)}</td>
                    <td className="px-4 py-3"><Badge status={item.status_denda as string} /></td>
                    <td className="px-4 py-3">
                      {item.status_denda === 'belum_dibayar' && (
                        <button
                          onClick={() => handleBayar(item.id as string)}
                          className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        >
                          Bayar
                        </button>
                      )}
                      {item.status_denda === 'sudah_dibayar' && item.tanggal_bayar ? (
                        <span className="text-xs text-gray-500">{formatDateShort(item.tanggal_bayar as string)}</span>
                      ) : null}
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
    </div>
  )
}
