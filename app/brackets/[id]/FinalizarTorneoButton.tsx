'use client'
import { useState } from 'react'

export default function FinalizarTorneoButton({ torneoId }: { torneoId: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const finalizar = async () => {
    if (!confirm('¿Dar por finalizado el torneo? Se corona al campeón en el Salón de la Fama y ya no se van a poder cargar más resultados nuevos (pero sí seguir corrigiendo los que ya están).')) return
    setLoading(true); setError('')
    const res = await fetch(`/api/torneos/${torneoId}/finalizar`, { method: 'POST' })
    const body = await res.json()
    if (!res.ok) { setError(body.error || 'Error al finalizar'); setLoading(false); return }
    window.location.reload()
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: 4 }}>
      <button onClick={finalizar} disabled={loading} style={{
        background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)',
        padding: '4px 10px', borderRadius: 6,
        fontFamily: 'var(--font-display)', fontSize: 9, letterSpacing: 0.5, cursor: 'pointer',
      }}>
        {loading ? 'Cerrando…' : '🏁 Dar por finalizado'}
      </button>
      {error && <span style={{ fontSize: 10, color: '#f87171' }}>{error}</span>}
    </div>
  )
}
