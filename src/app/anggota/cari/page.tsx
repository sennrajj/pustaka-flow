'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CariPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/anggota/katalog')
  }, [router])
  return null
}
