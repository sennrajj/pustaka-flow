'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import EmptyState from '@/components/ui/EmptyState'
import { formatDateShort, formatCurrency } from '@/lib/utils'
import { HiDocumentReport, HiDownload } from 'react-icons/hi'
import toast from 'react-hot-toast'

type LaporanType = 'buku' | 'anggota' | 'peminjaman' | 'pengembalian' | 'denda' | 'buku_sering_dipinjam' | 'buku_belum_dikembalikan'

export default function LaporanPage() {
  const [jenis, setJenis] = useState<LaporanType>('peminjaman')
  const [tanggalAwal, setTanggalAwal] = useState('')
  const [tanggalAkhir, setTanggalAkhir] = useState('')
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const generateLaporan = async () => {
    setLoading(true)
    try {
      let query

      switch (jenis) {
        case 'buku':
          query = supabase.from('buku').select('*, kategori(nama_kategori)').order('judul')
          break
        case 'anggota':
          query = supabase.from('anggota').select('*').order('nama')
          break
        case 'peminjaman':
          query = supabase.from('peminjaman').select('*, anggota(nama), petugas(nama)').order('tanggal_pinjam', { ascending: false })
          if (tanggalAwal) query = query.gte('tanggal_pinjam', tanggalAwal)
          if (tanggalAkhir) query = query.lte('tanggal_pinjam', tanggalAkhir)
          break
        case 'pengembalian':
          query = supabase.from('pengembalian').select('*, peminjaman(kode_peminjaman, anggota(nama)), petugas(nama)').order('tanggal_pengembalian', { ascending: false })
          if (tanggalAwal) query = query.gte('tanggal_pengembalian', tanggalAwal)
          if (tanggalAkhir) query = query.lte('tanggal_pengembalian', tanggalAkhir)
          break
        case 'denda':
          query = supabase.from('denda').select('*, anggota(nama)').order('created_at', { ascending: false })
          break
        case 'buku_sering_dipinjam':
          query = supabase.from('detail_peminjaman').select('id_buku, buku(judul, kode_buku, penulis)')
          break
        case 'buku_belum_dikembalikan':
          query = supabase.from('peminjaman').select('*, anggota(nama), detail_peminjaman(buku(judul))').eq('status_peminjaman', 'aktif').order('tanggal_jatuh_tempo')
          break
        default:
          return
      }

      const { data: result, error } = await query
      if (error) throw error
      setData(result || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('Gagal menghasilkan laporan')
    } finally {
      setLoading(false)
    }
  }

  const exportExcel = async () => {
    if (data.length === 0) {
      toast.error('Tidak ada data untuk diexport')
      return
    }

    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan')
    XLSX.writeFile(wb, `laporan_${jenis}_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('File Excel berhasil diunduh')
  }

  const exportPDF = async () => {
    if (data.length === 0) {
      toast.error('Tidak ada data untuk diexport')
      return
    }

    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text(`Laporan ${jenis.replace(/_/g, ' ').toUpperCase()}`, 14, 20)
    doc.setFontSize(10)
    doc.text(`Tanggal cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 28)

    const headers = Object.keys(data[0] || {}).filter(k => typeof data[0][k] !== 'object')
    const rows = data.map(item => headers.map(h => String(item[h] ?? '-')))

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 35,
      styles: { fontSize: 8 },
    })

    doc.save(`laporan_${jenis}_${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success('File PDF berhasil diunduh')
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
        <p className="text-sm text-gray-500 mt-1">Generate dan export laporan perpustakaan</p>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="jenis" className="block text-sm font-medium text-gray-700 mb-1">Jenis Laporan</label>
            <select id="jenis" value={jenis} onChange={(e) => setJenis(e.target.value as LaporanType)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="buku">Laporan Buku</option>
              <option value="anggota">Laporan Anggota</option>
              <option value="peminjaman">Laporan Peminjaman</option>
              <option value="pengembalian">Laporan Pengembalian</option>
              <option value="denda">Laporan Denda</option>
              <option value="buku_sering_dipinjam">Buku Sering Dipinjam</option>
              <option value="buku_belum_dikembalikan">Buku Belum Dikembalikan</option>
            </select>
          </div>
          <Input id="tgl_awal" label="Tanggal Awal" type="date" value={tanggalAwal} onChange={(e) => setTanggalAwal(e.target.value)} />
          <Input id="tgl_akhir" label="Tanggal Akhir" type="date" value={tanggalAkhir} onChange={(e) => setTanggalAkhir(e.target.value)} />
          <div className="flex items-end">
            <Button onClick={generateLaporan} loading={loading} className="w-full">
              <HiDocumentReport className="w-4 h-4 mr-2" />
              Generate
            </Button>
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      {data.length > 0 && (
        <div className="flex gap-3 mb-4">
          <Button variant="outline" onClick={exportExcel}>
            <HiDownload className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={exportPDF}>
            <HiDownload className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      )}

      {/* Results */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <LoadingSpinner />
        ) : data.length === 0 ? (
          <EmptyState message="Klik Generate untuk menghasilkan laporan" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">No</th>
                  {Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object' && k !== 'id').slice(0, 6).map(key => (
                    <th key={key} className="px-4 py-3 text-left font-medium text-gray-600 capitalize">
                      {key.replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.slice(0, 50).map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{idx + 1}</td>
                    {Object.entries(item).filter(([k, v]) => typeof v !== 'object' && k !== 'id').slice(0, 6).map(([key, value]) => (
                      <td key={key} className="px-4 py-3 text-gray-600">
                        {typeof value === 'number' && key.includes('denda') ? formatCurrency(value) : String(value ?? '-')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {data.length > 50 && (
              <p className="text-center text-sm text-gray-500 py-3">Menampilkan 50 dari {data.length} data. Export untuk melihat semua.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
