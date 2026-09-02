'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import HighlightCard from './HighlightCard'

export default function HighlightsGrid({ inicial, total }: { inicial: any[]; total: number }) {
  const [highlights, setHighlights] = useState(inicial)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [viewerPlayerId, setViewerPlayerId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('players').select('id').eq('user_id', user.id).single()
      if (data) setViewerPlayerId(data.id)
    })
  }, [])

  const cargarMas = async () => {
    setLoading(true)
    const res = await fetch(`/api/multimedia/highlights?page=${page + 1}`)
    const data = await res.json()
    setHighlights(h => [...h, ...data.highlights])
    setPage(p => p + 1)
    setLoading(false)
  }

  const quitar = (id: string) => setHighlights(h => h.filter(x => x.id !== id))

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
        {highlights.map(h => <HighlightCard key={h.id} highlight={h} viewerPlayerId={viewerPlayerId} onDeleted={quitar} />)}
      </div>
      {highlights.length < total && (
        <button onClick={cargarMas} disabled={loading} className="btn btn-ghost-gold" style={{ margin: '20px auto 0', display: 'block' }}>
          {loading ? 'Cargando...' : `Cargar más (${total - highlights.length} restantes)`}
        </button>
      )}
    </>
  )
}
