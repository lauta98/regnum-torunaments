'use client'
import { useState } from 'react'
import Link from 'next/link'

interface Props {
  listingId: string
  initialFavorito: boolean
  isLoggedIn: boolean
}

export default function FavoriteButton({ listingId, initialFavorito, isLoggedIn }: Props) {
  const [favorito, setFavorito] = useState(initialFavorito)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/market/favorito', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId }),
      })
      const data = await res.json()
      if (res.ok) setFavorito(data.favorito)
    } finally {
      setLoading(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <Link href="/login" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        marginTop: 10, padding: '9px 0', borderRadius: 8, width: '100%',
        background: 'transparent', border: '1px solid var(--dark-border)',
        color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none',
        cursor: 'pointer',
      }}>
        ♡ Guardar en favoritos
      </Link>
    )
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        marginTop: 10, padding: '9px 0', borderRadius: 8, width: '100%',
        background: favorito ? 'rgba(239,68,68,0.12)' : 'transparent',
        border: `1px solid ${favorito ? 'rgba(239,68,68,0.5)' : 'var(--dark-border)'}`,
        color: favorito ? '#F87171' : 'var(--text-muted)',
        fontSize: 13, cursor: loading ? 'wait' : 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {favorito ? '♥ Guardado en favoritos' : '♡ Guardar en favoritos'}
    </button>
  )
}
