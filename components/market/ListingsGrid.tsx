'use client'
import { useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ListingCard from './ListingCard'
import Spinner from './Spinner'

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
        <div style={{ fontSize: 56, marginBottom: 16 }}>🏰</div>
        <p className="cinzel" style={{ fontSize: 17, color: 'var(--text-primary)', marginBottom: 8 }}>
          {termino ? `No encontramos "${termino}"` : 'No hay publicaciones'}
        </p>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
          {termino
            ? `¿Tenés uno? Sé el primero en publicar "${termino}" y encontrá compradores fácilmente.`
            : 'Todavía no hay ítems publicados. ¡Sé el primero!'}
        </p>
        <Link href={`/market/nuevo?type=sell${query ? `&q=${encodeURIComponent(query)}` : ''}`} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, #1a5c35, #2E7D52)',
          color: '#fff', padding: '11px 24px', borderRadius: 8,
          fontFamily: "'Cinzel',serif", fontSize: 12, letterSpacing: 1, fontWeight: 700,
          textDecoration: 'none', boxShadow: '0 2px 12px rgba(46,125,82,0.3)',
        }}>
          🗡 Publicar un artículo
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
              padding: '12px 36px', borderRadius: 8, cursor: loading ? 'default' : 'pointer',
              background: loading ? 'var(--dark-surface)' : 'var(--dark-card)',
              border: '1px solid var(--dark-border-gold)',
              color: loading ? 'var(--text-muted)' : 'var(--gold)',
              fontFamily: "'Cinzel',serif", fontSize: 12, letterSpacing: 1,
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
