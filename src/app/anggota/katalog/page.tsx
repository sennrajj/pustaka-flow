'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Buku, Kategori } from '@/lib/types'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Pagination from '@/components/ui/Pagination'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import { HiSearch, HiHeart, HiOutlineHeart } from 'react-icons/hi'
import toast from 'react-hot-toast'

const ITEMS_PER_PAGE = 12

export default function KatalogPage() {
  const [buku, setBuku] = useState<Buku[]>([])
  const [kategori, setKategori] = useState<Kategori[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedBuku, setSelectedBuku] = useState<Buku | null>(null)
  const [wishlist, setWishlist] = useState<string[]>([])
  const [anggotaId, setAnggotaId] = useState<string | null>(null)
  const [requestLoading, setRequestLoading] = useState(false)

  const supabase = createClient()

  // Get anggota ID
  useEffect(() => {
    async function getAnggota() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('anggota').select('id').eq('user_id', user.id).single()
      if (data) {
        setAnggotaId(data.id)
        // Fetch wishlist
        const { data: wl } = await supabase.from('wishlist').select('id_buku').eq('id_anggota', data.id)
        setWishlist(wl?.map(w => w.id_buku) || [])
      }
    }
    getAnggota()
  }, [])

  const fetchBuku = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase.from('buku').select('*, kategori(nama_kategori)', { count: 'exact' })

      if (search) {
        query = query.or(`judul.ilike.%${search}%,penulis.ilike.%${search}%,isbn.ilike.%${search}%`)
      }
      if (filterKategori) {
        query = query.eq('id_kategori', filterKategori)
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      const { data, count, error } = await query.order('judul').range(from, to)
      if (error) throw error
      setBuku(data || [])
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [search, filterKategori, currentPage])

  useEffect(() => {
    supabase.from('kategori').select('*').order('nama_kategori').then(({ data }) => setKategori(data || []))
  }, [])

  useEffect(() => {
    fetchBuku()
  }, [fetchBuku])

  const toggleWishlist = async (bukuId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!anggotaId) {
      toast.error('Data anggota tidak ditemukan')
      return
    }

    try {
      if (wishlist.includes(bukuId)) {
        // Remove from wishlist
        const { error } = await supabase.from('wishlist').delete().eq('id_anggota', anggotaId).eq('id_buku', bukuId)
        if (error) throw error
        setWishlist(wishlist.filter(id => id !== bukuId))
        toast.success('Dihapus dari simpan')
      } else {
        // Add to wishlist
        const { error } = await supabase.from('wishlist').insert({ id_anggota: anggotaId, id_buku: bukuId })
        if (error) throw error
        setWishlist([...wishlist, bukuId])
        toast.success('Disimpan ke favorit')
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : JSON.stringify(error)
      console.error('Wishlist error:', msg)
      toast.error('Gagal menyimpan: ' + msg)
    }
  }

  const handleRequestPinjam = async () => {
    if (!anggotaId || !selectedBuku) return

    setRequestLoading(true)
    try {
      // Check if already has pending request for this book
      const { data: existing } = await supabase
        .from('request_peminjaman')
        .select('id')
        .eq('id_anggota', anggotaId)
        .eq('id_buku', selectedBuku.id)
        .eq('status_request', 'pending')

      if (existing && existing.length > 0) {
        toast.error('Anda sudah mengajukan peminjaman buku ini. Menunggu persetujuan petugas.')
        setRequestLoading(false)
        return
      }

      // Check stok
      if (selectedBuku.stok <= 0) {
        toast.error('Stok buku habis, tidak bisa mengajukan peminjaman')
        setRequestLoading(false)
        return
      }

      const { error } = await supabase.from('request_peminjaman').insert({
        id_anggota: anggotaId,
        id_buku: selectedBuku.id,
        status_request: 'pending',
      })

      if (error) {
        console.error('Insert error:', error.message, error.details, error.hint)
        throw new Error(error.message)
      }
      
      toast.success('Permintaan peminjaman berhasil diajukan! Menunggu persetujuan petugas.')
      setSelectedBuku(null)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : JSON.stringify(error)
      console.error('Request error:', msg)
      toast.error('Gagal mengajukan peminjaman: ' + msg)
    } finally {
      setRequestLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Katalog Buku</h1>
        <p className="text-sm text-gray-500 mt-1">Jelajahi koleksi buku perpustakaan</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Cari judul, penulis, ISBN..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterKategori} onChange={(e) => { setFilterKategori(e.target.value); setCurrentPage(1) }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Semua Kategori</option>
            {kategori.map((k) => (
              <option key={k.id} value={k.id}>{k.nama_kategori}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Book Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : buku.length === 0 ? (
        <EmptyState message="Tidak ada buku ditemukan" />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {buku.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedBuku(item)}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer relative group"
              >
                {/* Wishlist button */}
                <button
                  onClick={(e) => toggleWishlist(item.id, e)}
                  className="absolute top-3 right-3 z-10 p-2 bg-white/90 rounded-full shadow-sm hover:bg-white transition-colors"
                  title={wishlist.includes(item.id) ? 'Hapus dari simpan' : 'Simpan buku'}
                >
                  {wishlist.includes(item.id) ? (
                    <HiHeart className="w-5 h-5 text-red-500" />
                  ) : (
                    <HiOutlineHeart className="w-5 h-5 text-gray-400 group-hover:text-red-400" />
                  )}
                </button>

                {item.sampul_url ? (
                  <img src={item.sampul_url} alt={item.judul} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                    <span className="text-4xl">📚</span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">{item.judul}</h3>
                  <p className="text-sm text-gray-500 mb-2">{item.penulis}</p>
                  <div className="flex items-center justify-between">
                    <Badge status={item.status_buku} />
                    <span className="text-xs text-gray-400">Stok: {item.stok}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </>
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!selectedBuku} onClose={() => setSelectedBuku(null)} title="Detail Buku" size="lg">
        {selectedBuku && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {selectedBuku.sampul_url ? (
                <img src={selectedBuku.sampul_url} alt={selectedBuku.judul} className="w-32 h-44 object-cover rounded-lg flex-shrink-0" />
              ) : (
                <div className="w-32 h-44 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-4xl">📚</span>
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{selectedBuku.judul}</h3>
                <p className="text-sm text-gray-600 mb-3">{selectedBuku.penulis}</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Kode:</span> <span className="font-medium">{selectedBuku.kode_buku}</span></div>
                  <div><span className="text-gray-500">Penerbit:</span> <span className="font-medium">{selectedBuku.penerbit || '-'}</span></div>
                  <div><span className="text-gray-500">Tahun:</span> <span className="font-medium">{selectedBuku.tahun_terbit || '-'}</span></div>
                  <div><span className="text-gray-500">ISBN:</span> <span className="font-medium">{selectedBuku.isbn || '-'}</span></div>
                  <div><span className="text-gray-500">Kategori:</span> <span className="font-medium">{(selectedBuku as Buku & { kategori?: { nama_kategori: string } }).kategori?.nama_kategori || '-'}</span></div>
                  <div><span className="text-gray-500">Stok:</span> <span className="font-medium">{selectedBuku.stok}</span></div>
                </div>
                <div className="mt-2">
                  <Badge status={selectedBuku.status_buku} />
                </div>
              </div>
            </div>
            {selectedBuku.deskripsi && (
              <div className="border-t pt-3">
                <p className="text-sm text-gray-500 mb-1">Deskripsi:</p>
                <p className="text-sm text-gray-700">{selectedBuku.deskripsi}</p>
              </div>
            )}
            {/* Action buttons */}
            <div className="border-t pt-4 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleRequestPinjam}
                loading={requestLoading}
                disabled={selectedBuku.stok <= 0}
                className="flex-1"
              >
                {selectedBuku.stok <= 0 ? 'Stok Habis' : 'Ajukan Peminjaman'}
              </Button>
              <Button
                variant="outline"
                onClick={(e) => { toggleWishlist(selectedBuku.id, e as unknown as React.MouseEvent); }}
              >
                {wishlist.includes(selectedBuku.id) ? (
                  <><HiHeart className="w-4 h-4 mr-2 text-red-500" /> Tersimpan</>
                ) : (
                  <><HiOutlineHeart className="w-4 h-4 mr-2" /> Simpan</>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
