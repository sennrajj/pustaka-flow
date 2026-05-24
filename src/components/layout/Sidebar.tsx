'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { UserRole } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import {
  HiHome,
  HiBookOpen,
  HiCollection,
  HiUsers,
  HiUserGroup,
  HiClipboardList,
  HiRefresh,
  HiCash,
  HiDocumentReport,
  HiCog,
  HiClock,
  HiUser,
  HiHeart,
} from 'react-icons/hi'

interface MenuItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
}

function getMenuItems(role: UserRole, pendingCount: number): MenuItem[] {
  if (role === 'admin') {
    return [
      { label: 'Dashboard', href: '/admin/dashboard', icon: <HiHome className="w-5 h-5" /> },
      { label: 'Data Buku', href: '/admin/buku', icon: <HiBookOpen className="w-5 h-5" /> },
      { label: 'Data Kategori', href: '/admin/kategori', icon: <HiCollection className="w-5 h-5" /> },
      { label: 'Data Anggota', href: '/admin/anggota', icon: <HiUsers className="w-5 h-5" /> },
      { label: 'Data Petugas', href: '/admin/petugas', icon: <HiUserGroup className="w-5 h-5" /> },
      { label: 'Request Pinjam', href: '/admin/request-peminjaman', icon: <HiClipboardList className="w-5 h-5" />, badge: pendingCount },
      { label: 'Peminjaman', href: '/admin/peminjaman', icon: <HiClipboardList className="w-5 h-5" /> },
      { label: 'Pengembalian', href: '/admin/pengembalian', icon: <HiRefresh className="w-5 h-5" /> },
      { label: 'Denda', href: '/admin/denda', icon: <HiCash className="w-5 h-5" /> },
      { label: 'Laporan', href: '/admin/laporan', icon: <HiDocumentReport className="w-5 h-5" /> },
      { label: 'Pengaturan', href: '/admin/pengaturan', icon: <HiCog className="w-5 h-5" /> },
    ]
  }

  if (role === 'petugas') {
    return [
      { label: 'Dashboard', href: '/petugas/dashboard', icon: <HiHome className="w-5 h-5" /> },
      { label: 'Data Buku', href: '/petugas/buku', icon: <HiBookOpen className="w-5 h-5" /> },
      { label: 'Data Anggota', href: '/petugas/anggota', icon: <HiUsers className="w-5 h-5" /> },
      { label: 'Request Pinjam', href: '/petugas/request-peminjaman', icon: <HiClipboardList className="w-5 h-5" />, badge: pendingCount },
      { label: 'Peminjaman', href: '/petugas/peminjaman', icon: <HiClipboardList className="w-5 h-5" /> },
      { label: 'Pengembalian', href: '/petugas/pengembalian', icon: <HiRefresh className="w-5 h-5" /> },
      { label: 'Denda', href: '/petugas/denda', icon: <HiCash className="w-5 h-5" /> },
      { label: 'Laporan', href: '/petugas/laporan', icon: <HiDocumentReport className="w-5 h-5" /> },
    ]
  }

  // anggota
  return [
    { label: 'Dashboard', href: '/anggota/dashboard', icon: <HiHome className="w-5 h-5" /> },
    { label: 'Katalog Buku', href: '/anggota/katalog', icon: <HiBookOpen className="w-5 h-5" /> },
    { label: 'Buku Tersimpan', href: '/anggota/wishlist', icon: <HiHeart className="w-5 h-5" /> },
    { label: 'Permintaan Pinjam', href: '/anggota/request', icon: <HiClipboardList className="w-5 h-5" /> },
    { label: 'Riwayat Peminjaman', href: '/anggota/riwayat', icon: <HiClock className="w-5 h-5" /> },
    { label: 'Denda Saya', href: '/anggota/denda', icon: <HiCash className="w-5 h-5" /> },
    { label: 'Profil Saya', href: '/anggota/profil', icon: <HiUser className="w-5 h-5" /> },
  ]
}

interface SidebarProps {
  role: UserRole
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ role, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [pendingCount, setPendingCount] = useState(0)
  const supabase = createClient()

  // Fetch pending request count for admin/petugas
  useEffect(() => {
    if (role === 'admin' || role === 'petugas') {
      async function fetchPending() {
        const { count } = await supabase
          .from('request_peminjaman')
          .select('*', { count: 'exact', head: true })
          .eq('status_request', 'pending')
        setPendingCount(count || 0)
      }
      fetchPending()

      // Refresh every 30 seconds
      const interval = setInterval(fetchPending, 30000)
      return () => clearInterval(interval)
    }
  }, [role])

  const menuItems = getMenuItems(role, pendingCount)

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-100 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto shadow-xl lg:shadow-none',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <HiBookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">PustakaFlow</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 space-y-1 overflow-y-auto h-[calc(100vh-73px)] scrollbar-thin">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-0.5'
                )}
              >
                <span className={cn(
                  'transition-colors',
                  isActive ? 'text-blue-600' : 'text-gray-400'
                )}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
