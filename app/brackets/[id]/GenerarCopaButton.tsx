'use client'
import { useState } from 'react'

export default function GenerarCopaButton({ torneoId, cupo }: { torneoId: string; cupo: number }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generar = async () => {
    if (!confirm(`¿Generar la copa con los ${cupo} mejores puestos de la liga? No se puede deshacer.`)) return
    setLoading(true); setError('')
    const res = await fetch(`/api/torneos/${torneoId}/generar-copa`, { method: 'POST' })
    if (res.ok) {
      window.location.reload()
    } else {
      const d = await res.json().catch(() => null)
      setError(d?.error ?? 'Error al generar la copa')
      setLoading(false)
    }
  }

  return (
    <div style={{ textAlign: 'center', padding: '40px 24px', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12 }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>🏆</div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        La liga terminó. Listo para armar la copa.
      </p>
      <button onClick={generar} disabled={loading} style={{
        background: 'var(--gold)', color: '#000', padding: '12px 28px', borderRadius: 8, border: 'none',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, letterSpacing: 1,
        cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
      }}>
        {loading ? 'Generando...' : `⚔ Generar Copa (top ${cupo})`}
      </button>
      {error && <p style={{ color: '#f87171', fontSize: 12, marginTop: 14 }}>{error}</p>}
    </div>
  )
}
