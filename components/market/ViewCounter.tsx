'use client'
import { useEffect } from 'react'

export default function ViewCounter({ listingId }: { listingId: string }) {
  useEffect(() => {
    fetch(`/api/view/${listingId}`, { method: 'POST' }).catch(() => {})
  }, [listingId])
  return null
}
