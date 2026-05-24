'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Buku } from '@/lib/types'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { HiHeart, HiTrash } from 'react-icons/hi'
import toast from 'react-hot-toast'

export default function WishlistPage() {
  const [items, setItems] = useState<(Buku & { wishlist_id: string })[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function fetchWishlist() {
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
          .from('wishlist')
          .select('id, id_buku, buku(*, kategori(nama_kategori))')
          .eq('id_anggota', anggota.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        const formatted = (data || []).map((item: Record<string, unknown>) => ({
          ...(item.buku as Buku),
          wishlist_id: item.id as string,
        }))

        setItems(formatted)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWishlist()
  }, [])

  const removeFromWishlist = async (wishlistId: string) => {
    try {
      await supabase.from('wishlist').delete().eq('id', wishlistId)
      setItems(items.filter(i => i.wishlist_id !== wishlistId))
      toast.success('Dihapus dari simpan')
    } catch {
      toast.error('Gagal menghapus')
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Buku Tersimpan</h1>
        <p className="text-sm text-gray-500 mt-1">Daftar buku yang Anda simpan/favorit</p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Belum ada buku tersimpan"
          message="Simpan buku favorit Anda dari halaman Katalog"
          icon={<HiHeart className="w-12 h-12 text-gray-300 mb-3" />}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.wishlist_id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {item.sampul_url ? (
                <img src={item.sampul_url} alt={item.judul} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  <span className="text-3xl">📚</span>
                </div>
              )}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">{item.judul}</h3>
                <p className="text-sm text-gray-500 mb-2">{item.penulis}</p>
                <div className="flex items-center justify-between">
                  <Badge status={item.status_buku} />
                  <button
                    onClick={() => removeFromWishlist(item.wishlist_id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                    title="Hapus dari simpan"
                  >
                    <HiTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
