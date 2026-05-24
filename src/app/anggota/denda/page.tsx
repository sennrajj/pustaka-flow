'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatCurrency, formatDateShort } from '@/lib/utils'

export default function DendaAnggotaPage() {
  const [denda, setDenda] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function fetchDenda() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: anggota } = await supabase
          .from('anggota')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!anggota) return

        const { data, error } = await supabase
          .from('denda')
          .select('*, pengembalian(kode_pengembalian)')
          .eq('id_anggota', anggota.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setDenda(data || [])
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDenda()
  }, [])

  if (loading) return <LoadingSpinner />

  const totalBelumBayar = denda
    .filter(d => d.status_denda === 'belum_dibayar')
    .reduce((sum, d) => sum + (d.total_denda as number), 0)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Denda Saya</h1>
        <p className="text-sm text-gray-500 mt-1">Informasi denda keterlambatan pengembalian buku</p>
      </div>

      {totalBelumBayar > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-700">
            Total denda belum dibayar: <span className="font-bold">{formatCurrency(totalBelumBayar)}</span>
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {denda.length === 0 ? (
          <EmptyState message="Tidak ada denda" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Kode</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Hari Terlambat</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Total Denda</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Tgl Bayar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {denda.map((item) => (
                  <tr key={item.id as string} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">
                      {(item.pengembalian as { kode_pengembalian: string })?.kode_pengembalian || '-'}
                    </td>
                    <td className="px-4 py-3">{item.jumlah_hari_terlambat as number} hari</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(item.total_denda as number)}</td>
                    <td className="px-4 py-3"><Badge status={item.status_denda as string} /></td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.tanggal_bayar ? formatDateShort(item.tanggal_bayar as string) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
