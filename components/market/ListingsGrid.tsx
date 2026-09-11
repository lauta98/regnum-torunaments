'use client'
import { useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ListingCard from './ListingCard'
import Spinner from './Spinner'
import { IconChest, IconPlus } from './LineIcons'

const PAGE_SIZE = 24

interface Props {
  initialListings: any[]
  initialCount: number
  initialFavSet: string[]
}

export default function ListingsGrid({ initialListings, initialCount, initialFavSet }: Props) {
  const [listings, setListings]    = useState(initialListings)
  const [favSet]                   = useState(new Set(initialFavSet))
  const [page, setPage]            = useState(1)
  const [loading, setLoading]      = useState(false)
  const searchParams               = useSearchParams()

  const hasMore = listings.length < initialCount

  const loadMore = useCallback(async () => {
    setLoading(true)
    const nextPage = page + 1
    const sp = new URLSearchParams(searchParams.toString())
    sp.set('page', String(nextPage))
    const res = await fetch(`/api/market/listings?${sp.toString()}`)
    const data = await res.json()
    if (data.listings?.length) {
      setListings(prev => [...prev, ...data.listings])
      setPage(nextPage)
    }
    setLoading(false)
  }, [page, searchParams])

  if (!listings.length) {
    const query   = searchParams.get('q') || searchParams.get('search') || ''
    const cat     = searchParams.get('categoria') || ''
    const termino = query || cat

    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <IconChest size={44} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
        <p style={{ fontFamily: 'var(--font-display-v2)', fontSize: 20, color: 'var(--text-primary)', marginBottom: 8 }}>
          {termino ? `No encontramos "${termino}"` : 'No hay publicaciones'}
        </p>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
          {termino
            ? `¿Tenés uno? Sé el primero en publicar "${termino}" y encontrá compradores fácilmente.`
            : 'Todavía no hay ítems publicados. ¡Sé el primero!'}
        </p>
        <Link href={`/market/nuevo?type=sell${query ? `&q=${encodeURIComponent(query)}` : ''}`} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--gold)', color: '#050505', padding: '11px 24px',
          fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase',
          textDecoration: 'none', border: '1px solid var(--gold-light)',
        }}>
          <IconPlus size={13} /> Publicar un artículo
        </Link>
      </div>
    )
  }

  return (
    <>
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, alignItems: 'start' }}
        className="listings-grid"
      >
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            isFavorito={favSet.has(listing.id)}
          />
        ))}
      </div>

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button
            onClick={loadMore}
            disabled={loading}
            style={{
              padding: '12px 36px', cursor: loading ? 'default' : 'pointer',
              background: loading ? 'var(--bg-surface)' : 'var(--bg-card)',
              border: '1px solid var(--dark-border-gold)',
              color: loading ? 'var(--text-muted)' : 'var(--gold)',
              fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase',
              fontWeight: 600, transition: 'all 0.2s',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Spinner size={15} color="var(--text-muted)" /> Cargando...</span>
              : `Cargar más · ${listings.length} / ${initialCount}`}
          </button>
        </div>
      )}

      {!hasMore && listings.length > PAGE_SIZE && (
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Mostrando todos los resultados ({initialCount})
        </div>
      )}
    </>
  )
}
