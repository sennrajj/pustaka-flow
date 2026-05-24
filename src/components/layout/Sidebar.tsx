'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { UserRole } from '@/lib/types'
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
  HiSearch,
  HiClock,
  HiUser,
} from 'react-icons/hi'

interface MenuItem {
  label: string
  href: string
  icon: React.ReactNode
  children?: MenuItem[]
}

function getMenuItems(role: UserRole): MenuItem[] {
  if (role === 'admin') {
    return [
      { label: 'Dashboard', href: '/admin/dashboard', icon: <HiHome className="w-5 h-5" /> },
      { label: 'Data Buku', href: '/admin/buku', icon: <HiBookOpen className="w-5 h-5" /> },
      { label: 'Data Kategori', href: '/admin/kategori', icon: <HiCollection className="w-5 h-5" /> },
      { label: 'Data Anggota', href: '/admin/anggota', icon: <HiUsers className="w-5 h-5" /> },
      { label: 'Data Petugas', href: '/admin/petugas', icon: <HiUserGroup className="w-5 h-5" /> },
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
    { label: 'Cari Buku', href: '/anggota/cari', icon: <HiSearch className="w-5 h-5" /> },
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
  const menuItems = getMenuItems(role)

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-gray-200 transition-transform lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-200">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <HiBookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">PustakaFlow</span>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 space-y-1 overflow-y-auto h-[calc(100vh-73px)]">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
