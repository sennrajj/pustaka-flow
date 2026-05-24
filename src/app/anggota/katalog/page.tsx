'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Buku, Kategori } from '@/lib/types'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import EmptyState from '@/components/ui/EmptyState'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { HiSearch } from 'react-icons/hi'

const ITEMS_PER_PAGE = 12

export default function KatalogPage() {
  const [buku, setBuku] = useState<Buku[]>([])
  const [kategori, setKategori] = useState<Kategori[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const supabase = createClient()

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
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
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
    </div>
  )
}
