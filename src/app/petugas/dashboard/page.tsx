'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import StatCard from '@/components/ui/StatCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import {
  HiClipboardList,
  HiRefresh,
  HiBookOpen,
  HiExclamation,
  HiUsers,
} from 'react-icons/hi'

interface PetugasStats {
  peminjamanHariIni: number
  pengembalianHariIni: number
  bukuTersedia: number
  bukuTerlambat: number
  anggotaAktif: number
}

export default function PetugasDashboard() {
  const [stats, setStats] = useState<PetugasStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      try {
        const today = new Date().toISOString().split('T')[0]

        const [
          { count: peminjamanHariIni },
          { count: pengembalianHariIni },
          { count: bukuTersedia },
          { count: bukuTerlambat },
          { count: anggotaAktif },
        ] = await Promise.all([
          supabase.from('peminjaman').select('*', { count: 'exact', head: true }).eq('tanggal_pinjam', today),
          supabase.from('pengembalian').select('*', { count: 'exact', head: true }).eq('tanggal_pengembalian', today),
          supabase.from('buku').select('*', { count: 'exact', head: true }).eq('status_buku', 'tersedia'),
          supabase.from('peminjaman').select('*', { count: 'exact', head: true }).eq('status_peminjaman', 'terlambat'),
          supabase.from('anggota').select('*', { count: 'exact', head: true }).eq('status_anggota', 'aktif'),
        ])

        setStats({
          peminjamanHariIni: peminjamanHariIni || 0,
          pengembalianHariIni: pengembalianHariIni || 0,
          bukuTersedia: bukuTersedia || 0,
          bukuTerlambat: bukuTerlambat || 0,
          anggotaAktif: anggotaAktif || 0,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Petugas</h1>
        <p className="text-sm text-gray-500 mt-1">Ringkasan aktivitas perpustakaan hari ini</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Peminjaman Hari Ini"
          value={stats?.peminjamanHariIni || 0}
          icon={<HiClipboardList className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Pengembalian Hari Ini"
          value={stats?.pengembalianHariIni || 0}
          icon={<HiRefresh className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Buku Tersedia"
          value={stats?.bukuTersedia || 0}
          icon={<HiBookOpen className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          title="Buku Terlambat"
          value={stats?.bukuTerlambat || 0}
          icon={<HiExclamation className="w-6 h-6" />}
          color="red"
        />
        <StatCard
          title="Anggota Aktif"
          value={stats?.anggotaAktif || 0}
          icon={<HiUsers className="w-6 h-6" />}
          color="green"
        />
      </div>
    </div>
  )
}
