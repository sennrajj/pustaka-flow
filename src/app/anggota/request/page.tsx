'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatDateShort } from '@/lib/utils'
import { HiClipboardList } from 'react-icons/hi'

function getRequestBadgeColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    disetujui: 'bg-green-100 text-green-800',
    ditolak: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

function getRequestLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Menunggu',
    disetujui: 'Disetujui',
    ditolak: 'Ditolak',
  }
  return labels[status] || status
}

export default function RequestPage() {
  const [requests, setRequests] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function fetchRequests() {
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
          .from('request_peminjaman')
          .select('*, buku(judul, kode_buku, penulis, sampul_url)')
          .eq('id_anggota', anggota.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setRequests(data || [])
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Permintaan Peminjaman</h1>
        <p className="text-sm text-gray-500 mt-1">Status permintaan peminjaman buku Anda</p>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          title="Belum ada permintaan"
          message="Ajukan peminjaman buku dari halaman Katalog"
          icon={<HiClipboardList className="w-12 h-12 text-gray-300 mb-3" />}
        />
      ) : (
        <div className="space-y-3">
          {requests.map((item) => {
            const buku = item.buku as { judul: string; kode_buku: string; penulis: string; sampul_url?: string } | null
            return (
              <div key={item.id as string} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start gap-4">
                  {buku?.sampul_url ? (
                    <img src={buku.sampul_url} alt={buku.judul} className="w-16 h-20 object-cover rounded-lg flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">📚</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{buku?.judul || '-'}</h3>
                        <p className="text-sm text-gray-500">{buku?.penulis}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getRequestBadgeColor(item.status_request as string)}`}>
                        {getRequestLabel(item.status_request as string)}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      Diajukan: {formatDateShort(item.tanggal_request as string)}
                      {item.tanggal_diproses ? (
                        <span className="ml-3">Diproses: {formatDateShort(item.tanggal_diproses as string)}</span>
                      ) : null}
                    </div>
                    {item.catatan_admin && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500">Catatan petugas:</p>
                        <p className="text-sm text-gray-700">{item.catatan_admin as string}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
