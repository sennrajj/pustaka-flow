import { format, parseISO, differenceInDays } from 'date-fns'
import { id } from 'date-fns/locale'

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd MMMM yyyy', { locale: id })
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd/MM/yyyy')
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function hitungHariTerlambat(tanggalJatuhTempo: string): number {
  const today = new Date()
  const jatuhTempo = parseISO(tanggalJatuhTempo)
  const diff = differenceInDays(today, jatuhTempo)
  return diff > 0 ? diff : 0
}

export function hitungDenda(hariTerlambat: number, tarifPerHari: number): number {
  return hariTerlambat * tarifPerHari
}

export function generateKode(prefix: string, lastNumber: number): string {
  const nextNumber = lastNumber + 1
  return `${prefix}${String(nextNumber).padStart(3, '0')}`
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getStatusBadgeColor(status: string): string {
  const colors: Record<string, string> = {
    tersedia: 'bg-green-100 text-green-800',
    dipinjam: 'bg-yellow-100 text-yellow-800',
    stok_habis: 'bg-red-100 text-red-800',
    aktif: 'bg-green-100 text-green-800',
    tidak_aktif: 'bg-gray-100 text-gray-800',
    dikembalikan: 'bg-blue-100 text-blue-800',
    terlambat: 'bg-red-100 text-red-800',
    belum_dibayar: 'bg-red-100 text-red-800',
    sudah_dibayar: 'bg-green-100 text-green-800',
    selesai: 'bg-green-100 text-green-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    tersedia: 'Tersedia',
    dipinjam: 'Dipinjam',
    stok_habis: 'Stok Habis',
    aktif: 'Aktif',
    tidak_aktif: 'Tidak Aktif',
    dikembalikan: 'Dikembalikan',
    terlambat: 'Terlambat',
    belum_dibayar: 'Belum Dibayar',
    sudah_dibayar: 'Sudah Dibayar',
    selesai: 'Selesai',
  }
  return labels[status] || status
}
