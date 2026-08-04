'use client'
import { useState } from 'react'

export default function GenerarBracketButton({ torneoId, inscritos }: { torneoId: string; inscritos: number }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generar = async () => {
    if (!confirm(`¿Generar el cuadro con los ${inscritos} equipos inscriptos? Ya no se van a poder inscribir más equipos después de esto.`)) return
    setLoading(true); setError('')
    const res = await fetch(`/api/torneos/${torneoId}/generar-bracket`, { method: 'POST' })
    if (res.ok) {
      window.location.reload()
    } else {
      const d = await res.json()
      setError(d.error ?? 'Error al generar el cuadro')
      setLoading(false)
    }
  }

  return (
    <div style={{ textAlign: 'center', padding: '80px 24px', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🕐</div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
        El bracket aún no está disponible.
      </p>
      <button onClick={generar} disabled={loading || inscritos < 2} style={{
        background: inscritos < 2 ? 'var(--bg-surface)' : 'var(--gold)',
        color: inscritos < 2 ? 'var(--text-muted)' : '#000',
        padding: '12px 28px', borderRadius: 8, border: 'none',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, letterSpacing: 1,
        cursor: inscritos < 2 ? 'not-allowed' : 'pointer',
      }}>
        {loading ? 'Generando...' : inscritos < 2 ? 'Hacen falta al menos 2 equipos' : `⚔ Generar cuadro (${inscritos} equipos)`}
      </button>
      {error && <p style={{ color: '#f87171', fontSize: 12, marginTop: 14 }}>{error}</p>}
    </div>
  )
}
