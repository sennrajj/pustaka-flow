'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import { HiCheck, HiX, HiEye } from 'react-icons/hi'
import { formatDateShort } from '@/lib/utils'
import toast from 'react-hot-toast'

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

export default function RequestPeminjamanPage() {
  const [requests, setRequests] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('pending')
  const [showModal, setShowModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<Record<string, unknown> | null>(null)
  const [catatan, setCatatan] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const supabase = createClient()

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('request_peminjaman')
        .select('*, anggota(nama, kode_anggota), buku(judul, kode_buku, penulis, stok)')

      if (filterStatus) {
        query = query.eq('status_request', filterStatus)
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleAction = async (action: 'disetujui' | 'ditolak') => {
    if (!selectedRequest) return
    setActionLoading(true)

    try {
      // Get current petugas
      const { data: { user } } = await supabase.auth.getUser()
      let petugasId = null

      if (user) {
        const { data: petugas } = await supabase.from('petugas').select('id').eq('user_id', user.id).single()
        petugasId = petugas?.id || null
      }

      // Update request status
      const { error } = await supabase
        .from('request_peminjaman')
        .update({
          status_request: action,
          catatan_admin: catatan || null,
          tanggal_diproses: new Date().toISOString(),
          id_petugas: petugasId,
        })
        .eq('id', selectedRequest.id)

      if (error) throw error

      // If approved, create the actual peminjaman
      if (action === 'disetujui') {
        const buku = selectedRequest.buku as { stok: number } | null
        if (buku && buku.stok <= 0) {
          toast.error('Stok buku habis, tidak bisa disetujui')
          setActionLoading(false)
          return
        }

        // Get pengaturan
        const { data: pengaturan } = await supabase.from('pengaturan').select('batas_hari_peminjaman').single()
        const batasHari = pengaturan?.batas_hari_peminjaman || 7

        // Generate kode
        const { count } = await supabase.from('peminjaman').select('*', { count: 'exact', head: true })
        const kodePeminjaman = `PJM${String((count || 0) + 1).padStart(3, '0')}`

        const tanggalPinjam = new Date().toISOString().split('T')[0]
        const jatuhTempo = new Date()
        jatuhTempo.setDate(jatuhTempo.getDate() + batasHari)
        const tanggalJatuhTempo = jatuhTempo.toISOString().split('T')[0]

        // If no petugas found, try to get first one
        if (!petugasId) {
          const { data: firstPetugas } = await supabase.from('petugas').select('id').limit(1).single()
          petugasId = firstPetugas?.id
        }

        if (!petugasId) {
          toast.error('Tidak ada petugas terdaftar')
          setActionLoading(false)
          return
        }

        // Create peminjaman
        const { data: newPeminjaman, error: pError } = await supabase
          .from('peminjaman')
          .insert({
            kode_peminjaman: kodePeminjaman,
            id_anggota: selectedRequest.id_anggota,
            id_petugas: petugasId,
            tanggal_pinjam: tanggalPinjam,
            tanggal_jatuh_tempo: tanggalJatuhTempo,
            status_peminjaman: 'aktif',
          })
          .select()
          .single()

        if (pError) throw pError

        // Create detail peminjaman
        await supabase.from('detail_peminjaman').insert({
          id_peminjaman: newPeminjaman.id,
          id_buku: selectedRequest.id_buku,
          jumlah: 1,
        })

        // Reduce book stock
        const { data: bukuData } = await supabase
          .from('buku')
          .select('stok')
          .eq('id', selectedRequest.id_buku)
          .single()

        if (bukuData) {
          await supabase
            .from('buku')
            .update({ stok: bukuData.stok - 1 })
            .eq('id', selectedRequest.id_buku)
        }

        toast.success(`Permintaan disetujui! Peminjaman ${kodePeminjaman} dibuat.`)
      } else {
        toast.success('Permintaan ditolak')
      }

      setShowModal(false)
      setCatatan('')
      setSelectedRequest(null)
      fetchRequests()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Gagal memproses permintaan'
      toast.error(message)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Request Peminjaman</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola permintaan peminjaman dari anggota</p>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="pending">Menunggu Persetujuan</option>
          <option value="disetujui">Disetujui</option>
          <option value="ditolak">Ditolak</option>
          <option value="">Semua</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : requests.length === 0 ? (
          <EmptyState message="Tidak ada permintaan peminjaman" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Anggota</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Buku</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Tanggal</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((item) => {
                  const anggota = item.anggota as { nama: string; kode_anggota: string } | null
                  const buku = item.buku as { judul: string; kode_buku: string; stok: number } | null
                  return (
                    <tr key={item.id as string} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium">{anggota?.nama || '-'}</p>
                        <p className="text-xs text-gray-500">{anggota?.kode_anggota}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{buku?.judul || '-'}</p>
                        <p className="text-xs text-gray-500">{buku?.kode_buku} • Stok: {buku?.stok}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDateShort(item.tanggal_request as string)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRequestBadgeColor(item.status_request as string)}`}>
                          {getRequestLabel(item.status_request as string)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.status_request === 'pending' ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { setSelectedRequest(item); setShowModal(true); setCatatan('') }}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"
                              title="Proses"
                            >
                              <HiEye className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Sudah diproses</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Process Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Proses Permintaan Peminjaman">
        {selectedRequest && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Anggota:</span>
                  <p className="font-medium">{(selectedRequest.anggota as { nama: string })?.nama}</p>
                </div>
                <div>
                  <span className="text-gray-500">Buku:</span>
                  <p className="font-medium">{(selectedRequest.buku as { judul: string })?.judul}</p>
                </div>
                <div>
                  <span className="text-gray-500">Stok tersedia:</span>
                  <p className="font-medium">{(selectedRequest.buku as { stok: number })?.stok}</p>
                </div>
                <div>
                  <span className="text-gray-500">Tanggal request:</span>
                  <p className="font-medium">{formatDateShort(selectedRequest.tanggal_request as string)}</p>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="catatan" className="block text-sm font-medium text-gray-700 mb-1">
                Catatan (opsional)
              </label>
              <textarea
                id="catatan"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Catatan untuk anggota..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="danger"
                onClick={() => handleAction('ditolak')}
                loading={actionLoading}
              >
                <HiX className="w-4 h-4 mr-1" />
                Tolak
              </Button>
              <Button
                onClick={() => handleAction('disetujui')}
                loading={actionLoading}
              >
                <HiCheck className="w-4 h-4 mr-1" />
                Setujui & Proses Peminjaman
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
