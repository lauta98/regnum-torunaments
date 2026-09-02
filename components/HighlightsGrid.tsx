'use client'
import { useState } from 'react'
import HighlightCard from './HighlightCard'

export default function HighlightsGrid({ inicial, total }: { inicial: any[]; total: number }) {
  const [highlights, setHighlights] = useState(inicial)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const cargarMas = async () => {
    setLoading(true)
    const res = await fetch(`/api/multimedia/highlights?page=${page + 1}`)
    const data = await res.json()
    setHighlights(h => [...h, ...data.highlights])
    setPage(p => p + 1)
    setLoading(false)
  }

  if (highlights.length === 0) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 13, background: 'var(--bg-card)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)' }}>
        Todavía no se compartió nada. ¡Sé el primero!
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {highlights.map(h => <HighlightCard key={h.id} highlight={h} />)}
      </div>
      {highlights.length < total && (
        <button onClick={cargarMas} disabled={loading} className="btn btn-ghost-gold" style={{ margin: '20px auto 0', display: 'block' }}>
          {loading ? 'Cargando...' : `Cargar más (${total - highlights.length} restantes)`}
        </button>
      )}
    </>
  )
}
