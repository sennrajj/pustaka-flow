'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import StatCard from '@/components/ui/StatCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatCurrency } from '@/lib/utils'
import {
  HiBookOpen,
  HiClock,
  HiCash,
} from 'react-icons/hi'

interface AnggotaStats {
  bukuDipinjam: number
  totalDendaBelumBayar: number
}

export default function AnggotaDashboard() {
  const [stats, setStats] = useState<AnggotaStats | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get anggota data
        const { data: anggota } = await supabase
          .from('anggota')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!anggota) return

        const [
          { count: bukuDipinjam },
          { data: dendaData },
        ] = await Promise.all([
          supabase.from('peminjaman').select('*', { count: 'exact', head: true })
            .eq('id_anggota', anggota.id)
            .eq('status_peminjaman', 'aktif'),
          supabase.from('denda').select('total_denda')
            .eq('id_anggota', anggota.id)
            .eq('status_denda', 'belum_dibayar'),
        ])

        const totalDendaBelumBayar = dendaData?.reduce((sum, d) => sum + d.total_denda, 0) || 0

        setStats({
          bukuDipinjam: bukuDipinjam || 0,
          totalDendaBelumBayar,
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Anggota</h1>
        <p className="text-sm text-gray-500 mt-1">Selamat datang di perpustakaan digital</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Buku Dipinjam"
          value={stats?.bukuDipinjam || 0}
          icon={<HiBookOpen className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Riwayat Peminjaman"
          value="Lihat"
          icon={<HiClock className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          title="Denda Belum Dibayar"
          value={formatCurrency(stats?.totalDendaBelumBayar || 0)}
          icon={<HiCash className="w-6 h-6" />}
          color="red"
        />
      </div>
    </div>
  )
}
