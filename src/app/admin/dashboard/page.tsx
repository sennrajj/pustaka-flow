'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import StatCard from '@/components/ui/StatCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatCurrency } from '@/lib/utils'
import {
  HiBookOpen,
  HiCollection,
  HiUsers,
  HiUserGroup,
  HiClipboardList,
  HiRefresh,
  HiCash,
  HiCurrencyDollar,
} from 'react-icons/hi'

interface DashboardStats {
  totalBuku: number
  totalKategori: number
  totalAnggota: number
  totalPetugas: number
  peminjamanAktif: number
  totalPengembalian: number
  totalDenda: number
  dendaBelumDibayar: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      try {
        const [
          { count: totalBuku },
          { count: totalKategori },
          { count: totalAnggota },
          { count: totalPetugas },
          { count: peminjamanAktif },
          { count: totalPengembalian },
          { count: totalDenda },
          { data: dendaData },
        ] = await Promise.all([
          supabase.from('buku').select('*', { count: 'exact', head: true }),
          supabase.from('kategori').select('*', { count: 'exact', head: true }),
          supabase.from('anggota').select('*', { count: 'exact', head: true }),
          supabase.from('petugas').select('*', { count: 'exact', head: true }),
          supabase.from('peminjaman').select('*', { count: 'exact', head: true }).eq('status_peminjaman', 'aktif'),
          supabase.from('pengembalian').select('*', { count: 'exact', head: true }),
          supabase.from('denda').select('*', { count: 'exact', head: true }),
          supabase.from('denda').select('total_denda').eq('status_denda', 'belum_dibayar'),
        ])

        const dendaBelumDibayar = dendaData?.reduce((sum, d) => sum + d.total_denda, 0) || 0

        setStats({
          totalBuku: totalBuku || 0,
          totalKategori: totalKategori || 0,
          totalAnggota: totalAnggota || 0,
          totalPetugas: totalPetugas || 0,
          peminjamanAktif: peminjamanAktif || 0,
          totalPengembalian: totalPengembalian || 0,
          totalDenda: totalDenda || 0,
          dendaBelumDibayar,
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-sm text-gray-500 mt-1">Selamat datang di panel administrasi PustakaFlow</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Buku"
          value={stats?.totalBuku || 0}
          icon={<HiBookOpen className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Total Kategori"
          value={stats?.totalKategori || 0}
          icon={<HiCollection className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          title="Total Anggota"
          value={stats?.totalAnggota || 0}
          icon={<HiUsers className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Total Petugas"
          value={stats?.totalPetugas || 0}
          icon={<HiUserGroup className="w-6 h-6" />}
          color="indigo"
        />
        <StatCard
          title="Peminjaman Aktif"
          value={stats?.peminjamanAktif || 0}
          icon={<HiClipboardList className="w-6 h-6" />}
          color="yellow"
        />
        <StatCard
          title="Total Pengembalian"
          value={stats?.totalPengembalian || 0}
          icon={<HiRefresh className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="Total Denda"
          value={stats?.totalDenda || 0}
          icon={<HiCash className="w-6 h-6" />}
          color="red"
        />
        <StatCard
          title="Denda Belum Dibayar"
          value={formatCurrency(stats?.dendaBelumDibayar || 0)}
          icon={<HiCurrencyDollar className="w-6 h-6" />}
          color="orange"
        />
      </div>
    </div>
  )
}
