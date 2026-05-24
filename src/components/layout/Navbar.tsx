'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/lib/types'
import { HiMenu, HiLogout, HiUser, HiChevronDown } from 'react-icons/hi'
import toast from 'react-hot-toast'

interface NavbarProps {
  profile: Profile
  onMenuClick: () => void
}

export default function Navbar({ profile, onMenuClick }: NavbarProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Berhasil logout')
    router.push('/login')
    router.refresh()
  }

  const roleLabel = {
    admin: 'Administrator',
    petugas: 'Petugas',
    anggota: 'Anggota',
  }

  const roleColor = {
    admin: 'bg-purple-100 text-purple-700',
    petugas: 'bg-blue-100 text-blue-700',
    anggota: 'bg-green-100 text-green-700',
  }

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl hover:bg-gray-100 lg:hidden transition-colors"
            aria-label="Toggle menu"
          >
            <HiMenu className="w-5 h-5 text-gray-600" />
          </button>
          <div className="hidden sm:block">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${roleColor[profile.role]}`}>
              {roleLabel[profile.role]}
            </span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-200"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-bold">
                  {profile.nama.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900 leading-tight">{profile.nama}</p>
                <p className="text-xs text-gray-500 leading-tight">{profile.email}</p>
              </div>
              <HiChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
            </button>

            {showDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden animate-scale-in">
                  <div className="p-3 bg-gray-50 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{profile.nama}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{profile.email}</p>
                    <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-xs font-medium ${roleColor[profile.role]}`}>
                      {roleLabel[profile.role]}
                    </span>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <HiLogout className="w-4 h-4" />
                      Keluar dari akun
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
