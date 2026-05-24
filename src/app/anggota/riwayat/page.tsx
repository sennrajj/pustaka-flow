'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatDateShort } from '@/lib/utils'

export default function RiwayatPage() {
  const [peminjaman, setPeminjaman] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')

  const supabase = createClient()

  useEffect(() => {
    async function fetchRiwayat() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: anggota } = await supabase
          .from('anggota')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!anggota) return

        let query = supabase
          .from('peminjaman')
          .select('*, detail_peminjaman(buku(judul, kode_buku))')
          .eq('id_anggota', anggota.id)
          .order('created_at', { ascending: false })

        if (filterStatus) {
          query = query.eq('status_peminjaman', filterStatus)
        }

        const { data, error } = await query
        if (error) throw error
        setPeminjaman(data || [])
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRiwayat()
  }, [filterStatus])

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Riwayat Peminjaman</h1>
        <p className="text-sm text-gray-500 mt-1">Lihat riwayat peminjaman buku Anda</p>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Semua Status</option>
          <option value="aktif">Aktif</option>
          <option value="dikembalikan">Dikembalikan</option>
          <option value="terlambat">Terlambat</option>
        </select>
      </div>

      {/* List */}
      <div className="space-y-3">
        {peminjaman.length === 0 ? (
          <EmptyState message="Belum ada riwayat peminjaman" />
        ) : (
          peminjaman.map((item) => (
            <div key={item.id as string} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm font-medium">{item.kode_peminjaman as string}</span>
                <Badge status={item.status_peminjaman as string} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                <div>Tgl Pinjam: {formatDateShort(item.tanggal_pinjam as string)}</div>
                <div>Jatuh Tempo: {formatDateShort(item.tanggal_jatuh_tempo as string)}</div>
              </div>
              {(item.detail_peminjaman as { buku: { judul: string; kode_buku: string } }[])?.length > 0 && (
                <div className="border-t pt-2">
                  <p className="text-xs text-gray-500 mb-1">Buku:</p>
                  <ul className="space-y-1">
                    {(item.detail_peminjaman as { buku: { judul: string; kode_buku: string } }[]).map((d, idx) => (
                      <li key={idx} className="text-sm">{d.buku?.judul}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
